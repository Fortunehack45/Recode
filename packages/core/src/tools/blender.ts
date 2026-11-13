import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { exec as cpExec } from "node:child_process";
import { promisify } from "node:util";
import { Tool, ToolContext, ToolResult } from "./types.js";

const execAsync = promisify(cpExec);
const BLENDER_RPC_PORT = 8128;

async function sendBlenderRPC(action: string, params: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(10000);

    client.connect(BLENDER_RPC_PORT, "127.0.0.1", () => {
      const payload = JSON.stringify({ action, params });
      client.write(payload);
    });

    client.on("data", (data) => {
      try {
        const resp = JSON.parse(data.toString("utf-8"));
        resolve(resp);
      } catch (e) {
        reject(new Error(`Failed to parse Blender response: ${data.toString()}`));
      }
      client.destroy();
    });

    client.on("timeout", () => {
      client.destroy();
      reject(new Error("Blender RPC timed out. Ensure Blender is open and the Recode bridge addon is active."));
    });

    client.on("error", (err) => {
      reject(err);
    });
  });
}

export const blenderExecutePythonTool: Tool = {
  definition: {
    name: "blender_execute_python",
    description: "Execute a Python script directly inside active Blender or headless Blender environment.",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "Python code to execute in Blender context" },
      },
      required: ["code"],
    },
  },
  async execute(args: { code: string }, context: ToolContext): Promise<ToolResult> {
    try {
      // First try live RPC
      const rpcResult = await sendBlenderRPC("execute_script", { code: args.code }).catch(() => null);
      if (rpcResult && rpcResult.status === "ok") {
        return { success: true, output: `[Blender Live] ${rpcResult.message}` };
      }

      // Fallback: execute via headless blender if installed on PATH
      const tempScript = path.join(context.workspaceDir, ".recode_temp_script.py");
      fs.writeFileSync(tempScript, args.code, "utf-8");
      try {
        const { stdout } = await execAsync(`blender --background --python "${tempScript}"`, { cwd: context.workspaceDir });
        return { success: true, output: `[Headless Blender] ${stdout}` };
      } finally {
        if (fs.existsSync(tempScript)) fs.unlinkSync(tempScript);
      }
    } catch (err: any) {
      return { success: false, output: "", error: `Blender execution failed: ${err.message}` };
    }
  },
};

export const blenderCreateMeshTool: Tool = {
  definition: {
    name: "blender_create_mesh",
    description: "Generate a 3D procedural primitive mesh in Blender (cube, sphere, cylinder, plane).",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["cube", "sphere", "cylinder", "plane"], description: "Primitive type" },
        name: { type: "string", description: "Name for the created 3D mesh object" },
        size: { type: "number", description: "Dimensions/scale of the object (default 2.0)" },
      },
      required: ["type", "name"],
    },
  },
  async execute(args: { type: string; name: string; size?: number }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendBlenderRPC("create_mesh", {
        type: args.type,
        name: args.name,
        size: args.size || 2.0,
      });

      if (resp.status === "ok") {
        return { success: true, output: `Created 3D Object "${resp.object_name}" in Blender scene.` };
      }
      return { success: false, output: "", error: resp.message || "Failed to create mesh in Blender" };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const blenderExportAssetTool: Tool = {
  definition: {
    name: "blender_export_asset",
    description: "Export the current 3D Blender scene or object directly into the project assets directory as glTF/GLB, FBX, or OBJ.",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Relative output path in workspace (e.g. public/models/avatar.glb)" },
        format: { type: "string", enum: ["gltf", "fbx", "obj"], description: "Target 3D file format" },
      },
      required: ["filepath", "format"],
    },
  },
  async execute(args: { filepath: string; format: string }, context: ToolContext): Promise<ToolResult> {
    try {
      const fullPath = path.resolve(context.workspaceDir, args.filepath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      const resp = await sendBlenderRPC("export_asset", {
        filepath: fullPath,
        format: args.format,
      });

      if (resp.status === "ok") {
        return { success: true, output: `Successfully exported 3D asset to ${args.filepath}` };
      }
      return { success: false, output: "", error: resp.message || "Export failed" };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};
