import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  readFileTool,
  writeFileTool,
  editFileTool,
  listDirTool,
  fileSearchTool,
  grepSearchTool,
  execTool,
} from "./builtin.js";
import { ToolContext } from "./types.js";

test("Builtin tools execute correctly in workspace", async () => {
  const tmpWorkspace = path.join(os.tmpdir(), `recode_test_tools_${Date.now()}`);
  fs.mkdirSync(tmpWorkspace, { recursive: true });

  const ctx: ToolContext = { workspaceDir: tmpWorkspace };

  // 1. write_file
  const writeRes = await writeFileTool.execute(
    { path: "sub/greeting.txt", content: "Hello Recode World\nLine 2\nLine 3" },
    ctx
  );
  assert.strictEqual(writeRes.success, true);
  assert.strictEqual(fs.existsSync(path.join(tmpWorkspace, "sub/greeting.txt")), true);

  // 2. read_file
  const readRes = await readFileTool.execute(
    { path: "sub/greeting.txt", start_line: 1, end_line: 2 },
    ctx
  );
  assert.strictEqual(readRes.success, true);
  assert.match(readRes.output, /1: Hello Recode World/);
  assert.match(readRes.output, /2: Line 2/);

  // 3. edit_file
  const editRes = await editFileTool.execute(
    { path: "sub/greeting.txt", target: "Line 2", replacement: "Line Two Updated" },
    ctx
  );
  assert.strictEqual(editRes.success, true);
  const updatedContent = fs.readFileSync(path.join(tmpWorkspace, "sub/greeting.txt"), "utf-8");
  assert.strictEqual(updatedContent, "Hello Recode World\nLine Two Updated\nLine 3");

  // 4. list_dir
  const listRes = await listDirTool.execute({ path: "sub" }, ctx);
  assert.strictEqual(listRes.success, true);
  assert.match(listRes.output, /greeting\.txt/);

  // 5. file_search
  const searchRes = await fileSearchTool.execute({ query: "greeting" }, ctx);
  assert.strictEqual(searchRes.success, true);
  assert.match(searchRes.output, /greeting\.txt/);

  // 6. grep_search
  const grepRes = await grepSearchTool.execute({ pattern: "Two Updated" }, ctx);
  assert.strictEqual(grepRes.success, true);
  assert.match(grepRes.output, /Line Two Updated/);

  // 7. exec
  const isWin = process.platform === "win32";
  const cmd = isWin ? "Write-Output 'Recode CLI Test'" : "echo 'Recode CLI Test'";
  const execRes = await execTool.execute({ command: cmd }, ctx);
  assert.strictEqual(execRes.success, true);
  assert.match(execRes.output, /Recode CLI Test/);

  // Clean up
  try {
    fs.rmSync(tmpWorkspace, { recursive: true, force: true });
  } catch {}
});

import {
  BUILTIN_TOOLS,
  blenderSetupLightingTool,
  blenderSetupCameraTool,
  blenderAssignMaterialTool,
  unrealSetupLightingTool,
  unrealConfigurePhysicsTool,
} from "./builtin.js";

test("Studio 3D & Unreal Engine tools are registered with schemas", () => {
  assert.ok(BUILTIN_TOOLS.blender_setup_lighting);
  assert.ok(BUILTIN_TOOLS.blender_setup_camera);
  assert.ok(BUILTIN_TOOLS.blender_assign_material);
  assert.ok(BUILTIN_TOOLS.blender_apply_modifier);
  assert.ok(BUILTIN_TOOLS.blender_insert_keyframe);
  assert.ok(BUILTIN_TOOLS.blender_create_rig);
  assert.ok(BUILTIN_TOOLS.blender_render_frame);
  assert.ok(BUILTIN_TOOLS.unreal_setup_lighting);
  assert.ok(BUILTIN_TOOLS.unreal_setup_cinematic_camera);
  assert.ok(BUILTIN_TOOLS.unreal_configure_physics);
  assert.ok(BUILTIN_TOOLS.unreal_trigger_simulation);

  // Verify parameters schema
  assert.strictEqual(blenderSetupLightingTool.definition.name, "blender_setup_lighting");
  assert.ok(blenderSetupCameraTool.definition.parameters);
  assert.strictEqual(unrealSetupLightingTool.definition.name, "unreal_setup_lighting");
  assert.ok(unrealConfigurePhysicsTool.definition.parameters);
});
