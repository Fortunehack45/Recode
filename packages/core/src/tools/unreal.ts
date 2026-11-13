import http from "node:http";
import { Tool, ToolContext, ToolResult } from "./types.js";

const UNREAL_HOST = "127.0.0.1";
const UNREAL_PORT = 30010;

async function sendUnrealRequest(path: string, payload: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);

    const req = http.request(
      {
        hostname: UNREAL_HOST,
        port: UNREAL_PORT,
        path,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 10000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = body ? JSON.parse(body) : {};
            resolve(data);
          } catch {
            resolve({ raw: body });
          }
        });
      }
    );

    req.on("error", (err) => {
      reject(new Error(`Unreal Engine Web Remote Control connection failed: ${err.message}. Ensure Unreal Engine 5 is open with the Web Remote Control plugin enabled.`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Unreal Engine request timed out."));
    });

    req.write(postData);
    req.end();
  });
}

export const unrealExecutePythonTool: Tool = {
  definition: {
    name: "unreal_execute_python",
    description: "Execute Python code directly inside the running Unreal Engine 5 Editor session.",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "Python code to execute in Unreal Engine 5 (e.g., unreal.EditorLevelLibrary)" },
      },
      required: ["code"],
    },
  },
  async execute(args: { code: string }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendUnrealRequest("/remote/process/command", {
        command: `py ${args.code}`,
      });
      return { success: true, output: JSON.stringify(resp, null, 2) };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const unrealSpawnActorTool: Tool = {
  definition: {
    name: "unreal_spawn_actor",
    description: "Spawn an Actor, Static Mesh, or Blueprint into the active Unreal Engine 5 level.",
    parameters: {
      type: "object",
      properties: {
        assetPath: { type: "string", description: "Asset path in content browser (e.g. /Game/StarterContent/Shapes/Shape_Cube.Shape_Cube)" },
        location: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          description: "World coordinates (X, Y, Z)",
        },
      },
      required: ["assetPath"],
    },
  },
  async execute(args: { assetPath: string; location?: { x: number; y: number; z: number } }, _context: ToolContext): Promise<ToolResult> {
    try {
      const loc = args.location || { x: 0, y: 0, z: 0 };
      const pyCode = `
import unreal
asset = unreal.EditorAssetLibrary.load_asset("${args.assetPath}")
actor = unreal.EditorLevelLibrary.spawn_actor_from_object(asset, unreal.Vector(${loc.x}, ${loc.y}, ${loc.z}))
print(f"Spawned actor: {actor.get_name() if actor else 'None'}")
`;
      const resp = await sendUnrealRequest("/remote/process/command", { command: `py ${pyCode.trim()}` });
      return { success: true, output: `Spawned actor in Unreal Engine level: ${JSON.stringify(resp)}` };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const unrealInspectWorldTool: Tool = {
  definition: {
    name: "unreal_inspect_world",
    description: "Query and inspect actors, levels, and world properties in the active Unreal Engine 5 session.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filter or category of actors to inspect (optional)" },
      },
    },
  },
  async execute(_args: { query?: string }, _context: ToolContext): Promise<ToolResult> {
    try {
      const pyCode = `
import unreal
actors = unreal.EditorLevelLibrary.get_all_level_actors()
names = [a.get_name() for a in actors[:30]]
print("Active Actors:", names)
`;
      const resp = await sendUnrealRequest("/remote/process/command", { command: `py ${pyCode.trim()}` });
      return { success: true, output: JSON.stringify(resp, null, 2) };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};
