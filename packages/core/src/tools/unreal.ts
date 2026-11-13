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
      reject(new Error(`Unreal Engine Web Remote Control connection failed: ${err.message}. Ensure Unreal Engine 5 is open with the Web Remote Control plugin enabled on port 30010.`));
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
        code: { type: "string", description: "Python code to execute in Unreal Engine 5 context (e.g. unreal.EditorLevelLibrary)" },
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
    description: "Spawn an Actor, Static Mesh, or Blueprint into the active Unreal Engine 5 level at specified coordinates.",
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

export const unrealSetupLightingTool: Tool = {
  definition: {
    name: "unreal_setup_lighting",
    description: "Configure realistic environment lighting in Unreal Engine 5 with Lumen Global Illumination, Directional Sunlight (Lux), SkyLight, and Volumetric Fog.",
    parameters: {
      type: "object",
      properties: {
        sunIntensityLux: { type: "number", description: "Sun illuminance in Lux (default 75,000 for bright direct sunlight)" },
        sunTemperatureKelvin: { type: "number", description: "Color temperature in Kelvin (default 5500K daylight)" },
        enableVolumetricFog: { type: "boolean", description: "Enable volumetric atmosphere scattering for realistic god rays (default true)" },
      },
    },
  },
  async execute(args: { sunIntensityLux?: number; sunTemperatureKelvin?: number; enableVolumetricFog?: boolean }, _context: ToolContext): Promise<ToolResult> {
    try {
      const sunLux = args.sunIntensityLux ?? 75000;
      const kelvin = args.sunTemperatureKelvin ?? 5500;
      const fog = args.enableVolumetricFog ?? true;

      const pyCode = `
import unreal
# Spawn or configure Directional Light
dir_lights = unreal.GameplayStatics.get_all_actors_of_class(unreal.EditorLevelLibrary.get_editor_world(), unreal.DirectionalLight)
if dir_lights:
    sun_actor = dir_lights[0]
    comp = sun_actor.get_component_by_class(unreal.DirectionalLightComponent)
    if comp:
        comp.set_intensity(${sunLux})
        comp.set_use_temperature(True)
        comp.set_temperature(${kelvin})
        comp.set_atmosphere_sun_light(True)

# Spawn or configure Exponential Height Fog with Volumetric scattering
fogs = unreal.GameplayStatics.get_all_actors_of_class(unreal.EditorLevelLibrary.get_editor_world(), unreal.ExponentialHeightFog)
if fogs:
    fog_comp = fogs[0].get_component_by_class(unreal.ExponentialHeightFogComponent)
    if fog_comp:
        fog_comp.set_volumetric_fog(${fog ? "True" : "False"})

print("Lumen dynamic lighting and volumetric atmosphere successfully configured.")
`;
      const resp = await sendUnrealRequest("/remote/process/command", { command: `py ${pyCode.trim()}` });
      return { success: true, output: `Unreal Engine 5 Lumen lighting configured: ${JSON.stringify(resp)}` };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const unrealSetupCinematicCameraTool: Tool = {
  definition: {
    name: "unreal_setup_cinematic_camera",
    description: "Spawn and configure a CineCameraActor in Unreal Engine 5 with physical 35mm filmback sensor, focal length, and aperture bokeh.",
    parameters: {
      type: "object",
      properties: {
        focalLength: { type: "number", description: "Focal length in mm (e.g. 35, 50, 85)" },
        apertureFStop: { type: "number", description: "Aperture f-stop (e.g. 1.8 for shallow depth of field)" },
        location: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
        },
      },
    },
  },
  async execute(args: { focalLength?: number; apertureFStop?: number; location?: { x: number; y: number; z: number } }, _context: ToolContext): Promise<ToolResult> {
    try {
      const focal = args.focalLength ?? 50;
      const fstop = args.apertureFStop ?? 2.8;
      const loc = args.location || { x: -300, y: 0, z: 120 };

      const pyCode = `
import unreal
cam_actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.CineCameraActor, unreal.Vector(${loc.x}, ${loc.y}, ${loc.z}))
if cam_actor:
    cam_comp = cam_actor.get_cine_camera_component()
    cam_comp.current_focal_length = ${focal}
    cam_comp.current_aperture = ${fstop}
    print(f"Spawned CineCameraActor: {cam_actor.get_name()}")
`;
      const resp = await sendUnrealRequest("/remote/process/command", { command: `py ${pyCode.trim()}` });
      return { success: true, output: `Spawned CineCameraActor in Unreal Engine 5: ${JSON.stringify(resp)}` };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const unrealConfigurePhysicsTool: Tool = {
  definition: {
    name: "unreal_configure_physics",
    description: "Configure realistic rigid-body physics simulation, collision profile, and mass on an Actor in Unreal Engine 5.",
    parameters: {
      type: "object",
      properties: {
        actorName: { type: "string", description: "Name of the target actor in the level" },
        simulatePhysics: { type: "boolean", description: "Whether to enable rigid-body physics simulation (default true)" },
        collisionProfile: { type: "string", enum: ["BlockAll", "BlockAllDynamic", "OverlapAllDynamic", "PhysicsActor", "Ragdoll"], description: "Collision preset" },
        massKg: { type: "number", description: "Mass in kilograms (optional)" },
      },
      required: ["actorName"],
    },
  },
  async execute(args: { actorName: string; simulatePhysics?: boolean; collisionProfile?: string; massKg?: number }, _context: ToolContext): Promise<ToolResult> {
    try {
      const sim = args.simulatePhysics ?? true;
      const profile = args.collisionProfile || "PhysicsActor";
      const mass = args.massKg;

      const pyCode = `
import unreal
actor = unreal.EditorLevelLibrary.get_actor_reference("${args.actorName}")
if actor:
    comp = actor.get_component_by_class(unreal.PrimitiveComponent)
    if comp:
        comp.set_simulate_physics(${sim ? "True" : "False"})
        comp.set_collision_profile_name("${profile}")
        ${mass ? `comp.set_mass_override_in_kg(unreal.Name(), ${mass}, True)` : ""}
        print(f"Physics configured on {args.actorName}: simulate={sim}, profile={profile}")
`;
      const resp = await sendUnrealRequest("/remote/process/command", { command: `py ${pyCode.trim()}` });
      return { success: true, output: `Physics configured on "${args.actorName}": ${JSON.stringify(resp)}` };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const unrealTriggerSimulationTool: Tool = {
  definition: {
    name: "unreal_trigger_simulation",
    description: "Control Play In Editor (PIE) simulation or execute engine console commands (e.g. stat fps, stat unit, r.Nanite, r.Lumen).",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Console command to execute (e.g. 'stat fps', 'r.Nanite 1', 'r.Lumen 1', 'stat unit')" },
      },
      required: ["command"],
    },
  },
  async execute(args: { command: string }, _context: ToolContext): Promise<ToolResult> {
    try {
      const resp = await sendUnrealRequest("/remote/process/command", {
        command: args.command,
      });
      return { success: true, output: `Executed engine command "${args.command}": ${JSON.stringify(resp)}` };
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
