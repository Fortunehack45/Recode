# Recode Blender Bridge Addon
# Facilitates real-time 3D procedural modeling, shading, rendering, and asset export from Recode IDE.

bl_info = {
    "name": "Recode 3D Studio Bridge",
    "author": "Recode",
    "version": (1, 30, 8),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > Recode",
    "description": "Bi-directional WebSocket RPC bridge connecting Blender to Recode AI Swarm",
    "category": "Development",
}

import bpy
import json
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
        exec_globals = {"bpy": bpy}
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
        else:
            return {"status": "error", "message": f"Unknown mesh type: {mesh_type}"}

        obj = bpy.context.active_object
        obj.name = name
        return {"status": "ok", "object_name": obj.name}

    elif cmd_type == "assign_material":
        obj_name = params.get("object_name")
        mat_name = params.get("material_name", "RecodePBR")
        color = params.get("color", [0.8, 0.8, 0.8, 1.0])
        metallic = params.get("metallic", 0.0)
        roughness = params.get("roughness", 0.5)

        obj = bpy.data.objects.get(obj_name)
        if not obj:
            return {"status": "error", "message": f"Object not found: {obj_name}"}

        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = color
            bsdf.inputs["Metallic"].default_value = metallic
            bsdf.inputs["Roughness"].default_value = roughness

        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

        return {"status": "ok", "material_name": mat.name}

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
                # Schedule execution in Blender main thread
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
