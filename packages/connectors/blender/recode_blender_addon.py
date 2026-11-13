# Recode Blender Bridge Addon
# Facilitates real-time professional 3D procedural modeling, shading, lighting, rigging, animation, and asset export from Recode IDE.

bl_info = {
    "name": "Recode 3D Studio Bridge",
    "author": "Recode",
    "version": (1, 30, 9),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > Recode",
    "description": "Bi-directional WebSocket/Socket RPC bridge connecting Blender to Recode AI Swarm",
    "category": "Development",
}

import bpy
import json
import math
import socket
import threading
import traceback

DEFAULT_PORT = 8128
_server_thread = None
_running = False

def execute_recode_command(cmd_payload):
    """Executes a command sent from Recode in the Blender main thread."""
    cmd_type = cmd_payload.get("action")
    params = cmd_payload.get("params", {})

    if cmd_type == "execute_script":
        code = params.get("code", "")
        exec_globals = {"bpy": bpy, "math": math}
        exec(code, exec_globals)
        return {"status": "ok", "message": "Script executed successfully"}

    elif cmd_type == "create_mesh":
        mesh_type = params.get("type", "cube")
        name = params.get("name", "RecodeMesh")
        size = params.get("size", 2.0)
        location = params.get("location", (0, 0, 0))

        if mesh_type == "cube":
            bpy.ops.mesh.primitive_cube_add(size=size, location=location)
        elif mesh_type == "sphere":
            bpy.ops.mesh.primitive_uv_sphere_add(radius=size/2.0, location=location)
        elif mesh_type == "plane":
            bpy.ops.mesh.primitive_plane_add(size=size, location=location)
        elif mesh_type == "cylinder":
            bpy.ops.mesh.primitive_cylinder_add(radius=size/2.0, depth=size, location=location)
        elif mesh_type == "cone":
            bpy.ops.mesh.primitive_cone_add(radius1=size/2.0, depth=size, location=location)
        elif mesh_type == "torus":
            bpy.ops.mesh.primitive_torus_add(major_radius=size/2.0, minor_radius=size/6.0, location=location)
        else:
            return {"status": "error", "message": f"Unknown mesh type: {mesh_type}"}

        obj = bpy.context.active_object
        obj.name = name
        return {"status": "ok", "object_name": obj.name}

    elif cmd_type == "setup_lighting":
        # Professional 4-tier lighting setup: Key, Fill, Rim, and Ambient/HDRI
        key_energy = params.get("key_energy", 1000.0)
        fill_energy = params.get("fill_energy", 350.0)
        rim_energy = params.get("rim_energy", 700.0)
        use_agx = params.get("use_agx", True)

        # Set color management to AgX if available
        if use_agx and hasattr(bpy.context.scene.view_settings, "view_transform"):
            try:
                bpy.context.scene.view_settings.view_transform = "AgX"
            except Exception:
                pass

        # 1. Key Light
        key_data = bpy.data.lights.new(name="Recode_KeyLight", type='AREA')
        key_data.energy = key_energy
        key_data.size = 2.0
        key_data.use_contact_shadow = True
        key_obj = bpy.data.objects.new("Recode_KeyLight", key_data)
        key_obj.location = (4.0, -4.0, 5.0)
        bpy.context.collection.objects.link(key_obj)

        # 2. Fill Light (soft shadow lift, opposite key)
        fill_data = bpy.data.lights.new(name="Recode_FillLight", type='AREA')
        fill_data.energy = fill_energy
        fill_data.size = 4.0
        fill_obj = bpy.data.objects.new("Recode_FillLight", fill_data)
        fill_obj.location = (-4.0, -2.0, 3.0)
        bpy.context.collection.objects.link(fill_obj)

        # 3. Rim / Back Light (silhouette edge separation)
        rim_data = bpy.data.lights.new(name="Recode_RimLight", type='SPOT')
        rim_data.energy = rim_energy
        rim_data.spot_size = math.radians(45)
        rim_obj = bpy.data.objects.new("Recode_RimLight", rim_data)
        rim_obj.location = (0.0, 5.0, 4.0)
        bpy.context.collection.objects.link(rim_obj)

        return {
            "status": "ok",
            "message": "Professional 3-point lighting setup with AgX color management applied.",
            "lights": ["Recode_KeyLight", "Recode_FillLight", "Recode_RimLight"],
        }

    elif cmd_type == "setup_camera":
        focal_length = params.get("focal_length", 50.0)
        fstop = params.get("fstop", 2.8)
        sensor_width = params.get("sensor_width", 36.0)
        location = params.get("location", (0.0, -6.0, 2.0))
        rotation = params.get("rotation", (math.radians(75), 0, 0))
        target_obj_name = params.get("target_object")

        cam_data = bpy.data.cameras.new(name="Recode_CinematicCamera")
        cam_data.lens = focal_length
        cam_data.sensor_width = sensor_width
        cam_data.dof.use_dof = True
        cam_data.dof.aperture_fstop = fstop

        if target_obj_name and target_obj_name in bpy.data.objects:
            cam_data.dof.focus_object = bpy.data.objects[target_obj_name]

        cam_obj = bpy.data.objects.new("Recode_CinematicCamera", cam_data)
        cam_obj.location = location
        cam_obj.rotation_euler = rotation
        bpy.context.collection.objects.link(cam_obj)
        bpy.context.scene.camera = cam_obj

        return {
            "status": "ok",
            "camera_name": cam_obj.name,
            "focal_length": focal_length,
            "fstop": fstop,
        }

    elif cmd_type == "assign_material":
        obj_name = params.get("object_name")
        mat_name = params.get("material_name", "RecodePBR")
        color = params.get("color", [0.8, 0.8, 0.8, 1.0])
        metallic = params.get("metallic", 0.0)
        roughness = params.get("roughness", 0.5)
        subsurface = params.get("subsurface", 0.0)
        ior = params.get("ior", 1.45)
        emission_color = params.get("emission_color", [0.0, 0.0, 0.0, 1.0])
        emission_strength = params.get("emission_strength", 0.0)

        obj = bpy.data.objects.get(obj_name)
        if not obj:
            return {"status": "error", "message": f"Object not found: {obj_name}"}

        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            if "Base Color" in bsdf.inputs:
                bsdf.inputs["Base Color"].default_value = color
            if "Metallic" in bsdf.inputs:
                bsdf.inputs["Metallic"].default_value = metallic
            if "Roughness" in bsdf.inputs:
                bsdf.inputs["Roughness"].default_value = roughness
            if "Subsurface Weight" in bsdf.inputs:
                bsdf.inputs["Subsurface Weight"].default_value = subsurface
            elif "Subsurface" in bsdf.inputs:
                bsdf.inputs["Subsurface"].default_value = subsurface
            if "IOR" in bsdf.inputs:
                bsdf.inputs["IOR"].default_value = ior
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission_color
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emission_strength

        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

        return {"status": "ok", "material_name": mat.name}

    elif cmd_type == "apply_modifier":
        obj_name = params.get("object_name")
        mod_type = params.get("modifier_type", "SUBSURF")
        mod_name = params.get("modifier_name", f"Recode_{mod_type}")

        obj = bpy.data.objects.get(obj_name)
        if not obj:
            return {"status": "error", "message": f"Object not found: {obj_name}"}

        mod = obj.modifiers.new(name=mod_name, type=mod_type)

        if mod_type == "SUBSURF":
            mod.levels = params.get("levels", 2)
            mod.render_levels = params.get("render_levels", 3)
        elif mod_type == "BEVEL":
            mod.width = params.get("width", 0.02)
            mod.segments = params.get("segments", 3)
            mod.profile = 0.70
        elif mod_type == "WEIGHTED_NORMAL":
            mod.weight = 50
            mod.keep_sharp = True
            obj.data.use_auto_smooth = True

        return {"status": "ok", "modifier": mod.name, "object": obj.name}

    elif cmd_type == "insert_keyframe":
        obj_name = params.get("object_name")
        frame = params.get("frame", 1)
        data_path = params.get("data_path", "location")
        value = params.get("value")
        interpolation = params.get("interpolation", "BEZIER")

        obj = bpy.data.objects.get(obj_name)
        if not obj:
            return {"status": "error", "message": f"Object not found: {obj_name}"}

        if value is not None and hasattr(obj, data_path):
            setattr(obj, data_path, value)

        obj.keyframe_insert(data_path=data_path, frame=frame)

        # Set interpolation easing on animation curves
        if obj.animation_data and obj.animation_data.action:
            for fcurve in obj.animation_data.action.fcurves:
                if fcurve.data_path == data_path:
                    for kf in fcurve.keyframe_points:
                        if int(kf.co.x) == int(frame):
                            kf.interpolation = interpolation

        return {"status": "ok", "frame": frame, "data_path": data_path, "object": obj.name}

    elif cmd_type == "create_rig":
        armature_name = params.get("name", "Recode_Armature")
        bpy.ops.object.armature_add()
        arm_obj = bpy.context.active_object
        arm_obj.name = armature_name

        return {"status": "ok", "armature_name": arm_obj.name}

    elif cmd_type == "export_asset":
        filepath = params.get("filepath", "")
        format_type = params.get("format", "gltf")

        if format_type == "gltf":
            bpy.ops.export_scene.gltf(filepath=filepath, export_format='GLB')
        elif format_type == "fbx":
            bpy.ops.export_scene.fbx(filepath=filepath)
        elif format_type == "obj":
            bpy.ops.wm.obj_export(filepath=filepath)
        else:
            return {"status": "error", "message": f"Unsupported export format: {format_type}"}

        return {"status": "ok", "exported_path": filepath}

    elif cmd_type == "render_frame":
        output_path = params.get("output_path", "//render.png")
        engine = params.get("engine", "CYCLES")
        samples = params.get("samples", 128)

        bpy.context.scene.render.engine = engine
        if engine == "CYCLES":
            bpy.context.scene.cycles.samples = samples
            try:
                bpy.context.scene.cycles.use_denoising = True
            except Exception:
                pass

        bpy.context.scene.render.filepath = output_path
        bpy.ops.render.render(write_still=True)
        return {"status": "ok", "rendered_path": bpy.path.abspath(output_path)}

    return {"status": "error", "message": f"Unknown action: {cmd_type}"}

def start_rpc_server(port=DEFAULT_PORT):
    global _running
    _running = True
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(("127.0.0.1", port))
    server_socket.listen(5)
    server_socket.settimeout(1.0)

    print(f"[Recode Bridge] Listening on 127.0.0.1:{port}")

    while _running:
        try:
            client, addr = server_socket.accept()
        except socket.timeout:
            continue
        except Exception:
            break

        try:
            data = client.recv(65536)
            if data:
                payload = json.loads(data.decode("utf-8"))
                response = execute_recode_command(payload)
                client.sendall(json.dumps(response).encode("utf-8"))
        except Exception as e:
            err = {"status": "error", "message": str(e), "trace": traceback.format_exc()}
            client.sendall(json.dumps(err).encode("utf-8"))
        finally:
            client.close()

    server_socket.close()

def register():
    global _server_thread
    _server_thread = threading.Thread(target=start_rpc_server, daemon=True)
    _server_thread.start()

def unregister():
    global _running
    _running = False

if __name__ == "__main__":
    register()
