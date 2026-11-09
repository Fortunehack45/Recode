import fs from "node:fs";
import path from "node:path";
import { exec as cpExec } from "node:child_process";
import { promisify } from "node:util";
import { Tool, ToolContext, ToolResult } from "./types.js";

const execAsync = promisify(cpExec);

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "target",
  "dist",
  "build",
  ".next",
  ".cache",
  ".gemini",
  "venv",
  ".venv",
]);

function resolvePath(filePath: string, workspaceDir: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(workspaceDir, filePath);
}

// 1. read_file
export const readFileTool: Tool = {
  definition: {
    name: "read_file",
    description: "Read contents of a file with optional start and end line numbers.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file to read" },
        start_line: { type: "number", description: "1-based starting line number (optional)" },
        end_line: { type: "number", description: "1-based ending line number (optional)" },
      },
      required: ["path"],
    },
  },
  async execute(args: { path: string; start_line?: number; end_line?: number }, context: ToolContext): Promise<ToolResult> {
    try {
      const fullPath = resolvePath(args.path, context.workspaceDir);
      if (!fs.existsSync(fullPath)) {
        return { success: false, output: "", error: `File not found: ${args.path}` };
      }

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        return { success: false, output: "", error: `Target path is a directory, not a file: ${args.path}` };
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      let start = args.start_line ? Math.max(1, args.start_line) - 1 : 0;
      let end = args.end_line ? Math.min(lines.length, args.end_line) : lines.length;

      if (start >= lines.length) {
        return { success: true, output: "(file has fewer lines than start_line)" };
      }

      const selected = lines.slice(start, end);
      const numbered = selected.map((line, idx) => `${start + idx + 1}: ${line}`).join("\n");
      return { success: true, output: numbered };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

// 2. write_file
export const writeFileTool: Tool = {
  definition: {
    name: "write_file",
    description: "Write content to a file. Creates parent directories automatically if they do not exist.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file to create or overwrite" },
        content: { type: "string", description: "Full content to write" },
      },
      required: ["path", "content"],
    },
  },
  async execute(args: { path: string; content: string }, context: ToolContext): Promise<ToolResult> {
    try {
      const fullPath = resolvePath(args.path, context.workspaceDir);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, args.content, "utf-8");
      const bytes = Buffer.byteLength(args.content, "utf-8");
      return { success: true, output: `Successfully wrote ${bytes} bytes to ${args.path}` };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

// 3. edit_file
export const editFileTool: Tool = {
  definition: {
    name: "edit_file",
    description: "Edit an existing file by replacing an exact target block of text with a replacement block.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file to edit" },
        target: { type: "string", description: "Exact target substring to replace" },
        replacement: { type: "string", description: "Replacement text" },
      },
      required: ["path", "target", "replacement"],
    },
  },
  async execute(args: { path: string; target: string; replacement: string }, context: ToolContext): Promise<ToolResult> {
    try {
      const fullPath = resolvePath(args.path, context.workspaceDir);
      if (!fs.existsSync(fullPath)) {
        return { success: false, output: "", error: `File not found: ${args.path}` };
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      if (!content.includes(args.target)) {
        return {
          success: false,
          output: "",
          error: `Target string was not found in ${args.path}. Ensure the target matches the exact file contents including whitespace.`,
        };
      }

      const occurrences = content.split(args.target).length - 1;
      const updated = content.replace(args.target, args.replacement);
      fs.writeFileSync(fullPath, updated, "utf-8");

      return {
        success: true,
        output: `Successfully updated ${args.path} (${occurrences} occurrence replaced).`,
      };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

// 4. list_dir
export const listDirTool: Tool = {
  definition: {
    name: "list_dir",
    description: "List files and subdirectories in a directory with file sizes and directory indicators.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path to list (defaults to workspace root)" },
      },
    },
  },
  async execute(args: { path?: string }, context: ToolContext): Promise<ToolResult> {
    try {
      const dirPath = resolvePath(args.path || ".", context.workspaceDir);
      if (!fs.existsSync(dirPath)) {
        return { success: false, output: "", error: `Directory not found: ${args.path || "."}` };
      }

      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const rows: string[] = [];

      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue;

        const fullEntry = path.join(dirPath, entry.name);
        try {
          const stat = fs.statSync(fullEntry);
          if (entry.isDirectory()) {
            rows.push(`[DIR]  ${entry.name}/`);
          } else {
            rows.push(`[FILE] ${entry.name.padEnd(30)} ${stat.size} bytes`);
          }
        } catch {
          // ignore unreadable
        }
      }

      return {
        success: true,
        output: rows.length > 0 ? rows.join("\n") : "(empty directory)",
      };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

// 5. file_search
export const fileSearchTool: Tool = {
  definition: {
    name: "file_search",
    description: "Search for files by name pattern across the workspace.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Substrings or filename to match" },
        max_results: { type: "number", description: "Maximum results to return (default 50)" },
      },
      required: ["query"],
    },
  },
  async execute(args: { query: string; max_results?: number }, context: ToolContext): Promise<ToolResult> {
    try {
      const results: string[] = [];
      const max = args.max_results || 50;
      const lowerQuery = args.query.toLowerCase();

      function walk(dir: string) {
        if (results.length >= max) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (IGNORED_DIRS.has(entry.name)) continue;
          const full = path.join(dir, entry.name);
          const rel = path.relative(context.workspaceDir, full);

          if (entry.name.toLowerCase().includes(lowerQuery)) {
            results.push(rel);
            if (results.length >= max) return;
          }

          if (entry.isDirectory()) {
            walk(full);
          }
        }
      }

      walk(context.workspaceDir);
      return {
        success: true,
        output: results.length > 0 ? results.join("\n") : `No files found matching "${args.query}"`,
      };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

// 6. grep_search
export const grepSearchTool: Tool = {
  definition: {
    name: "grep_search",
    description: "Search file contents across workspace for text or regex patterns.",
    parameters: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Regex pattern or string to search for" },
        max_results: { type: "number", description: "Maximum matching lines to return (default 50)" },
      },
      required: ["pattern"],
    },
  },
  async execute(args: { pattern: string; max_results?: number }, context: ToolContext): Promise<ToolResult> {
    try {
      const results: string[] = [];
      const max = args.max_results || 50;
      const regex = new RegExp(args.pattern, "i");

      function walk(dir: string) {
        if (results.length >= max) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (IGNORED_DIRS.has(entry.name)) continue;
          const full = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            walk(full);
          } else if (entry.isFile()) {
            // avoid giant binaries
            try {
              const stat = fs.statSync(full);
              if (stat.size > 2 * 1024 * 1024) continue; // skip files > 2MB

              const content = fs.readFileSync(full, "utf-8");
              const lines = content.split("\n");
              const rel = path.relative(context.workspaceDir, full);

              for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                  results.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
                  if (results.length >= max) return;
                }
              }
            } catch {
              // skip unreadable or binary
            }
          }
        }
      }

      walk(context.workspaceDir);
      return {
        success: true,
        output: results.length > 0 ? results.join("\n") : `No matches found for "${args.pattern}"`,
      };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

// 7. exec / bash
export const execTool: Tool = {
  definition: {
    name: "exec",
    description: "Execute a shell command in the workspace directory with timeout and output capture.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to run" },
        timeout_ms: { type: "number", description: "Timeout in milliseconds (default 30000)" },
      },
      required: ["command"],
    },
  },
  async execute(args: { command: string; timeout_ms?: number }, context: ToolContext): Promise<ToolResult> {
    try {
      const isWin = process.platform === "win32";
      const shell = isWin ? "powershell.exe" : "/bin/bash";
      const timeout = args.timeout_ms || 30000;

      const { stdout, stderr } = await execAsync(args.command, {
        cwd: context.workspaceDir,
        shell,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      });

      const out = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
      return {
        success: true,
        output: out || "(command exited with code 0, no output)",
      };
    } catch (err: any) {
      const out = [err.stdout?.toString().trim(), err.stderr?.toString().trim()].filter(Boolean).join("\n");
      return {
        success: false,
        output: out,
        error: err.message,
      };
    }
  },
};

export const BUILTIN_TOOLS: Record<string, Tool> = {
  read_file: readFileTool,
  write_file: writeFileTool,
  edit_file: editFileTool,
  list_dir: listDirTool,
  file_search: fileSearchTool,
  grep_search: grepSearchTool,
  exec: execTool,
};
