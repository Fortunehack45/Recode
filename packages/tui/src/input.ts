import readline from "node:readline/promises";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ThemeManager } from "./theme.js";
import { FontManager } from "./font.js";
import { fitCell } from "./text.js";

export interface InputContext {
  mode: "build" | "plan";
  workspaceDir: string;
  currentModel: string;
  tokens: number;
}

export class NativeInputBox {
  private history: string[] = [];
  private historyIndex = -1;
  private currentSavedLine = "";

  public async prompt(
    ctx: InputContext,
    onModeToggle?: (newMode: "build" | "plan") => void
  ): Promise<string> {
    const isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY);

    if (!isTTY) {
      // Non-interactive fallback
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const promptStr = `[${ctx.mode}] > `;
      const line = await rl.question(promptStr);
      rl.close();
      return line.trim();
    }

    return new Promise<string>((resolve) => {
      let buffer = "";
      let cursor = 0;
      let mode = ctx.mode;
      const theme = ThemeManager.get();
      const font = FontManager.get();

      // Configure stdin raw mode
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf-8");

      let renderedLines = 0;

      const render = () => {
        const innerWidth = 69; // Exactly 73 columns visible width (matches dashboard)
        const glyphs = font.glyphs;

        // Clear previously rendered lines if any
        if (renderedLines > 0) {
          process.stdout.write(`\x1b[${renderedLines}A\r\x1b[0J`);
        }

        const lines: string[] = [];

        // 1. Top border (73 cols)
        const top =
          "  " +
          theme.border(glyphs.tl) +
          theme.border(glyphs.horiz.repeat(innerWidth)) +
          theme.border(glyphs.tr);
        lines.push(top);

        // 2. Middle prompt line (73 cols)
        const promptSymbol = theme.accent(theme.bold("> "));
        // Truncate/scroll if buffer exceeds inner text width
        const availableTextWidth = innerWidth - 4; // 65 chars
        let displayBuffer = buffer;
        let displayCursor = cursor;

        if (displayBuffer.length > availableTextWidth) {
          const start = Math.max(0, cursor - availableTextWidth + 5);
          displayBuffer = displayBuffer.slice(start, start + availableTextWidth);
          displayCursor = cursor - start;
        }

        const beforeCursor = displayBuffer.slice(0, displayCursor);
        const atCursor = displayBuffer[displayCursor] || " ";
        const afterCursor = displayBuffer.slice(displayCursor + 1);

        const cursorBlock = `\x1b[7m${atCursor}\x1b[27m`; // Invert color for cursor block
        const inputContent = beforeCursor + cursorBlock + afterCursor;

        // Pad right inside the box
        const contentPlainLen = displayBuffer.length + 1;
        const rightPad = Math.max(0, availableTextWidth - contentPlainLen);

        const middle =
          "  " +
          theme.border(glyphs.vert) +
          " " +
          promptSymbol +
          inputContent +
          " ".repeat(rightPad) +
          " " +
          theme.border(glyphs.vert);
        lines.push(middle);

        // 3. Bottom border
        const bottom =
          "  " +
          theme.border(glyphs.bl) +
          theme.border(glyphs.horiz.repeat(innerWidth)) +
          theme.border(glyphs.br);
        lines.push(bottom);

        // 4. Status dock line
        const relDir = path.basename(ctx.workspaceDir) || ctx.workspaceDir;
        const modeBadge =
          mode === "build"
            ? theme.fg(theme.palette.success)(theme.bold("[BUILD]"))
            : theme.fg(theme.palette.secondary)(theme.bold("[PLAN]"));
        const dock =
          `  ${modeBadge} ${theme.dim("[Shift+Tab: mode]")}  ${theme.text(relDir)}  ` +
          `${theme.border("│")}  ${theme.dim(`${(ctx.tokens / 1000).toFixed(1)}k tokens`)}  ` +
          `${theme.border("│")}  ${theme.accent(ctx.currentModel)}`;
        lines.push(dock);

        process.stdout.write(lines.join("\n") + "\n");
        renderedLines = lines.length;
      };

      render();

      const cleanup = () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        // Cleanly wipe the input card from the screen so user message can be printed
        if (renderedLines > 0) {
          process.stdout.write(`\x1b[${renderedLines}A\r\x1b[0J`);
          renderedLines = 0;
        }
      };

      const getClipboardText = (): string => {
        try {
          if (process.platform === "win32") {
            return execSync("powershell -NoProfile -Command Get-Clipboard", {
              encoding: "utf-8",
              stdio: ["ignore", "pipe", "ignore"],
            })
              .replace(/\r?\n/g, " ")
              .trim();
          }
          if (process.platform === "darwin") {
            return execSync("pbpaste", { encoding: "utf-8" }).replace(/\r?\n/g, " ").trim();
          }
          return execSync("xclip -selection clipboard -o", { encoding: "utf-8" })
            .replace(/\r?\n/g, " ")
            .trim();
        } catch {
          return "";
        }
      };

      const onData = (data: string) => {
        // 1. Enter key (\r or \n)
        if (data === "\r" || data === "\n") {
          cleanup();
          const trimmed = buffer.trim();
          if (trimmed && this.history[this.history.length - 1] !== trimmed) {
            this.history.push(trimmed);
          }
          this.historyIndex = -1;
          resolve(trimmed);
          return;
        }

        // 2. Ctrl+C (\x03)
        if (data === "\x03") {
          if (buffer.length > 0) {
            buffer = "";
            cursor = 0;
            render();
            return;
          }
          cleanup();
          process.exit(0);
        }

        // 3. Ctrl+V (\x16) - Clipboard paste on Windows/macOS/Linux!
        if (data === "\x16") {
          const pasted = getClipboardText();
          if (pasted) {
            buffer = buffer.slice(0, cursor) + pasted + buffer.slice(cursor);
            cursor += pasted.length;
            render();
          }
          return;
        }

        // 4. Bracketed paste support (e.g. Right-click paste or Shift+Insert)
        if (data.includes("\x1b[200~")) {
          const pasted = data
            .replace(/\x1b\[200~/g, "")
            .replace(/\x1b\[201~/g, "")
            .replace(/\r?\n/g, " ");
          buffer = buffer.slice(0, cursor) + pasted + buffer.slice(cursor);
          cursor += pasted.length;
          render();
          return;
        }

        // 5. Shift+Tab (\x1b[Z) or Ctrl+T (\x14) - Instant mode toggle!
        if (data === "\x1b[Z" || data === "\x14") {
          mode = mode === "build" ? "plan" : "build";
          if (onModeToggle) onModeToggle(mode);
          render();
          return;
        }

        // 6. Tab key (\t) - Autocompletion
        if (data === "\t") {
          if (buffer.startsWith("/")) {
            const commands = [
              "/welcome",
              "/dashboard",
              "/theme",
              "/font",
              "/color",
              "/mode",
              "/model",
              "/models",
              "/connect",
              "/status",
              "/diff",
              "/clear",
              "/help",
              "/exit",
            ];
            const match = commands.find((c) => c.startsWith(buffer.toLowerCase()));
            if (match) {
              buffer = match + " ";
              cursor = buffer.length;
              render();
            }
          } else {
            const atIdx = buffer.lastIndexOf("@");
            if (atIdx !== -1) {
              const filePrefix = buffer.slice(atIdx + 1);
              try {
                const searchDir = ctx.workspaceDir;
                const entries = fs.readdirSync(searchDir);
                const fileMatch = entries.find((e) =>
                  e.toLowerCase().startsWith(filePrefix.toLowerCase())
                );
                if (fileMatch) {
                  buffer = buffer.slice(0, atIdx + 1) + fileMatch + " ";
                  cursor = buffer.length;
                  render();
                }
              } catch {}
            }
          }
          return;
        }

        // 7. Backspace (\x7f or \b)
        if (data === "\x7f" || data === "\b") {
          if (cursor > 0) {
            buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
            cursor--;
            render();
          }
          return;
        }

        // 8. Escape sequences (arrows, home, end, delete)
        if (data.startsWith("\x1b")) {
          // Left arrow
          if (data === "\x1b[D") {
            if (cursor > 0) {
              cursor--;
              render();
            }
            return;
          }
          // Right arrow
          if (data === "\x1b[C") {
            if (cursor < buffer.length) {
              cursor++;
              render();
            }
            return;
          }
          // Up arrow (history backward)
          if (data === "\x1b[A") {
            if (this.history.length > 0) {
              if (this.historyIndex === -1) {
                this.currentSavedLine = buffer;
                this.historyIndex = this.history.length - 1;
              } else if (this.historyIndex > 0) {
                this.historyIndex--;
              }
              buffer = this.history[this.historyIndex] || "";
              cursor = buffer.length;
              render();
            }
            return;
          }
          // Down arrow (history forward)
          if (data === "\x1b[B") {
            if (this.historyIndex !== -1) {
              if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                buffer = this.history[this.historyIndex] || "";
              } else {
                this.historyIndex = -1;
                buffer = this.currentSavedLine;
              }
              cursor = buffer.length;
              render();
            }
            return;
          }
          // Home
          if (data === "\x1b[H" || data === "\x1b[1~") {
            cursor = 0;
            render();
            return;
          }
          // End
          if (data === "\x1b[F" || data === "\x1b[4~") {
            cursor = buffer.length;
            render();
            return;
          }
          // Delete
          if (data === "\x1b[3~") {
            if (cursor < buffer.length) {
              buffer = buffer.slice(0, cursor) + buffer.slice(cursor + 1);
              render();
            }
            return;
          }
          return;
        }

        // 9. Regular text input & pasted text chunks
        // Filter out unprintable control characters, but convert newlines to spaces so multiline paste won't break
        const cleanChars = data
          .replace(/\r\n/g, " ")
          .replace(/[\r\n]/g, " ")
          .replace(/\t/g, "  ")
          .replace(/[\x00-\x1F\x7F]/g, "");
        if (cleanChars) {
          buffer = buffer.slice(0, cursor) + cleanChars + buffer.slice(cursor);
          cursor += cleanChars.length;
          render();
        }
      };

      process.stdin.on("data", onData);
    });
  }
}
