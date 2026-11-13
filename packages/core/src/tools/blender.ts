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
      reject(new Error("Blender RPC timed out. Ensure Blender is running and the Recode Bridge addon is enabled on port 8128."));
    });

    client.on("error", (err) => {
      reject(err);
    });
  });
}

export const blenderExecutePythonTool: Tool = {
  definition: {
    name: "blender_execute_python",
    description: "Execute a Python script directly inside the active Blender session or headless environment.",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "Python code to execute in Blender context (access to bpy)" },
      },
      required: ["code"],
    },
  },
  async execute(args: { code: string }, context: ToolContext): Promise<ToolResult> {
    try {
      const rpcResult = await sendBlenderRPC("execute_script", { code: args.code }).catch(() => null);
      if (rpcResult && rpcResult.status === "ok") {
        return { success: true, output: `[Blender Live] ${rpcResult.message}` };
      }

      // Fallback: headless execution
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
    description: "Generate a 3D procedural primitive mesh in Blender (cube, sphere, cylinder, plane, cone, torus).",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["cube", "sphere", "cylinder", "plane", "cone", "torus"], description: "Primitive geometry type" },
        name: { type: "string", description: "Name for the created 3D mesh object" },
        size: { type: "number", description: "Scale or dimensions of the object (default 2.0)" },
        location: {
          type: "array",
          items: { type: "number" },
          description: "World coordinates [X, Y, Z] (optional)",
        },
      },
      required: ["type", "name"],
    },
  },
  async execute(args: { type: string; name: string; size?: number; location?: number[] }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendBlenderRPC("create_mesh", {
        type: args.type,
        name: args.name,
        size: args.size || 2.0,
        location: args.location || [0, 0, 0],
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

export const blenderSetupLightingTool: Tool = {
  definition: {
    name: "blender_setup_lighting",
    description: "Setup professional 4-tier studio lighting in Blender (Key, Fill, Rim, and Ambient) with AgX color management.",
    parameters: {
      type: "object",
      properties: {
        keyEnergy: { type: "number", description: "Key light wattage (default 1000W)" },
        fillEnergy: { type: "number", description: "Fill light wattage (default 350W)" },
        rimEnergy: { type: "number", description: "Rim / edge light wattage (default 700W)" },
        useAgX: { type: "boolean", description: "Enable AgX color management to prevent highlight clipping (default true)" },
      },
    },
  },
  async execute(args: { keyEnergy?: number; fillEnergy?: number; rimEnergy?: number; useAgX?: boolean }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendBlenderRPC("setup_lighting", {
        key_energy: args.keyEnergy ?? 1000.0,
        fill_energy: args.fillEnergy ?? 350.0,
        rim_energy: args.rimEnergy ?? 700.0,
        use_agx: args.useAgX ?? true,
      });

      if (resp.status === "ok") {
        return { success: true, output: `${resp.message} Lights configured: ${resp.lights.join(", ")}` };
      }
      return { success: false, output: "", error: resp.message };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const blenderSetupCameraTool: Tool = {
  definition: {
    name: "blender_setup_camera",
    description: "Create and position a cinematic camera with physical sensor optics, focal length, and aperture depth of field (bokeh).",
    parameters: {
      type: "object",
      properties: {
        focalLength: { type: "number", description: "Lens focal length in mm (e.g. 24, 35, 50, 85)" },
        fstop: { type: "number", description: "Aperture f-stop for depth of field (e.g. 1.8 for shallow cinematic bokeh)" },
        targetObject: { type: "string", description: "Name of the 3D object to track and maintain in sharp focus" },
        location: { type: "array", items: { type: "number" }, description: "Camera position [X, Y, Z]" },
      },
    },
  },
  async execute(args: { focalLength?: number; fstop?: number; targetObject?: string; location?: number[] }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendBlenderRPC("setup_camera", {
        focal_length: args.focalLength ?? 50.0,
        fstop: args.fstop ?? 2.8,
        target_object: args.targetObject,
        location: args.location ?? [0.0, -6.0, 2.0],
      });

      if (resp.status === "ok") {
        return { success: true, output: `Configured cinematic camera "${resp.camera_name}" (Focal: ${resp.focal_length}mm, f/${resp.fstop})` };
      }
      return { success: false, output: "", error: resp.message };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const blenderAssignMaterialTool: Tool = {
  definition: {
    name: "blender_assign_material",
    description: "Create and assign a physically-based PBR material (Principled BSDF) to an object with metallic, roughness, and subsurface scattering.",
    parameters: {
      type: "object",
      properties: {
        objectName: { type: "string", description: "Target 3D object name" },
        materialName: { type: "string", description: "Name for the created PBR material" },
        color: { type: "array", items: { type: "number" }, description: "RGBA base color [R, G, B, A] from 0.0 to 1.0" },
        metallic: { type: "number", description: "Metallic property (0.0 dielectric to 1.0 pure metal)" },
        roughness: { type: "number", description: "Surface roughness (0.0 mirror to 1.0 diffuse)" },
        subsurface: { type: "number", description: "Subsurface scattering weight for organic skin/wax/marble (0.0 to 1.0)" },
        ior: { type: "number", description: "Index of Refraction (e.g. 1.45 standard, 1.33 water, 1.52 glass)" },
        emissionColor: { type: "array", items: { type: "number" }, description: "RGBA emission color for glowing elements" },
        emissionStrength: { type: "number", description: "Emission luminance strength" },
      },
      required: ["objectName"],
    },
  },
  async execute(args: {
    objectName: string;
    materialName?: string;
    color?: number[];
    metallic?: number;
    roughness?: number;
    subsurface?: number;
    ior?: number;
    emissionColor?: number[];
    emissionStrength?: number;
  }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendBlenderRPC("assign_material", {
        object_name: args.objectName,
        material_name: args.materialName || "RecodePBR",
        color: args.color || [0.8, 0.8, 0.8, 1.0],
        metallic: args.metallic ?? 0.0,
        roughness: args.roughness ?? 0.5,
        subsurface: args.subsurface ?? 0.0,
        ior: args.ior ?? 1.45,
        emission_color: args.emissionColor || [0.0, 0.0, 0.0, 1.0],
        emission_strength: args.emissionStrength ?? 0.0,
      });

      if (resp.status === "ok") {
        return { success: true, output: `Assigned PBR material "${resp.material_name}" to object "${args.objectName}"` };
      }
      return { success: false, output: "", error: resp.message };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const blenderApplyModifierTool: Tool = {
  definition: {
    name: "blender_apply_modifier",
    description: "Add a non-destructive modifier to an object in Blender (Catmull-Clark subdivision, bevel with edge highlights, weighted normals).",
    parameters: {
      type: "object",
      properties: {
        objectName: { type: "string", description: "Target 3D object name" },
        modifierType: { type: "string", enum: ["SUBSURF", "BEVEL", "WEIGHTED_NORMAL", "SOLIDIFY"], description: "Modifier type" },
        levels: { type: "number", description: "Subdivision levels (for SUBSURF, default 2)" },
        width: { type: "number", description: "Bevel width in meters (for BEVEL, default 0.02)" },
        segments: { type: "number", description: "Bevel segments (for BEVEL, default 3)" },
      },
      required: ["objectName", "modifierType"],
    },
  },
  async execute(args: { objectName: string; modifierType: string; levels?: number; width?: number; segments?: number }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendBlenderRPC("apply_modifier", {
        object_name: args.objectName,
        modifier_type: args.modifierType,
        levels: args.levels ?? 2,
        width: args.width ?? 0.02,
        segments: args.segments ?? 3,
      });

      if (resp.status === "ok") {
        return { success: true, output: `Applied modifier "${resp.modifier}" to object "${resp.object}"` };
      }
      return { success: false, output: "", error: resp.message };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const blenderInsertKeyframeTool: Tool = {
  definition: {
    name: "blender_insert_keyframe",
    description: "Insert an animation keyframe for an object or bone with cubic Bezier easing curves.",
    parameters: {
      type: "object",
      properties: {
        objectName: { type: "string", description: "Target 3D object name" },
        frame: { type: "number", description: "Timeline frame index (e.g. 1, 24, 60)" },
        dataPath: { type: "string", enum: ["location", "rotation_euler", "scale"], description: "Transform property" },
        value: { type: "array", items: { type: "number" }, description: "New 3D transform value [X, Y, Z] (optional)" },
        interpolation: { type: "string", enum: ["BEZIER", "LINEAR", "CONSTANT"], description: "F-Curve interpolation easing" },
      },
      required: ["objectName", "frame", "dataPath"],
    },
  },
  async execute(args: { objectName: string; frame: number; dataPath: string; value?: number[]; interpolation?: string }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendBlenderRPC("insert_keyframe", {
        object_name: args.objectName,
        frame: args.frame,
        data_path: args.dataPath,
        value: args.value,
        interpolation: args.interpolation || "BEZIER",
      });

      if (resp.status === "ok") {
        return { success: true, output: `Inserted keyframe on frame ${resp.frame} for "${resp.object}" (${resp.data_path})` };
      }
      return { success: false, output: "", error: resp.message };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const blenderCreateRigTool: Tool = {
  definition: {
    name: "blender_create_rig",
    description: "Generate a skeletal Armature rig in Blender for character animation and kinematics.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the Armature object" },
      },
      required: ["name"],
    },
  },
  async execute(args: { name: string }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendBlenderRPC("create_rig", { name: args.name });
      if (resp.status === "ok") {
        return { success: true, output: `Created skeletal armature "${resp.armature_name}" in Blender.` };
      }
      return { success: false, output: "", error: resp.message };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const blenderRenderFrameTool: Tool = {
  definition: {
    name: "blender_render_frame",
    description: "Render a photorealistic frame using Cycles path tracing (with AI denoising) or EEVEE Next.",
    parameters: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Relative or absolute output image path (e.g. renders/hero_shot.png)" },
        engine: { type: "string", enum: ["CYCLES", "BLENDER_EEVEE_NEXT"], description: "Render engine (default CYCLES)" },
        samples: { type: "number", description: "Render sample count (default 128)" },
      },
      required: ["outputPath"],
    },
  },
  async execute(args: { outputPath: string; engine?: string; samples?: number }, context: ToolContext): Promise<ToolResult> {
    try {
      const fullPath = path.resolve(context.workspaceDir, args.outputPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      const resp = await sendBlenderRPC("render_frame", {
        output_path: fullPath,
        engine: args.engine || "CYCLES",
        samples: args.samples ?? 128,
      });

      if (resp.status === "ok") {
        return { success: true, output: `Successfully rendered frame to ${resp.rendered_path}` };
      }
      return { success: false, output: "", error: resp.message };
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
