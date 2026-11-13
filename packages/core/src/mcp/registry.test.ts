import { test } from "node:test";
import assert from "node:assert/strict";
import { IntegrationRegistry } from "./registry.js";

test("IntegrationRegistry: contains official canonical providers only", () => {
  const registry = new IntegrationRegistry();
  const all = registry.getAll();

  assert.ok(all.length >= 7);

  // Vercel
  const vercel = registry.get("vercel");
  assert.ok(vercel);
  assert.equal(vercel.provenance, "first_party_remote");
  assert.equal(vercel.transport, "streamable_http");
  assert.equal(vercel.endpoint, "https://mcp.vercel.com");
  assert.equal(vercel.toolNamespace, "mcp:vercel");

  // Supabase
  const supabase = registry.get("supabase");
  assert.ok(supabase);
  assert.equal(supabase.provenance, "first_party_remote");
  assert.equal(supabase.transport, "streamable_http");
  assert.equal(supabase.endpoint, "https://mcp.supabase.com/mcp");
  assert.equal(supabase.toolNamespace, "mcp:supabase");

  // Blender Lab
  const blenderLab = registry.get("blender-lab");
  assert.ok(blenderLab);
  assert.equal(blenderLab.provenance, "first_party_local");
  assert.equal(blenderLab.transport, "stdio");
  assert.equal(blenderLab.command, "uvx");
  assert.equal(blenderLab.dependencies.application?.minVersion, "5.1");

  // Unreal Engine Epic Embedded
  const unrealEpic = registry.get("unreal-engine-epic");
  assert.ok(unrealEpic);
  assert.equal(unrealEpic.provenance, "first_party_embedded");
  assert.equal(unrealEpic.dependencies.application?.minVersion, "5.5");

  // GitHub
  const github = registry.get("github");
  assert.ok(github);
  assert.equal(github.endpoint, "https://api.githubcopilot.com/mcp/");

  // Render
  const render = registry.get("render");
  assert.ok(render);
  assert.equal(render.endpoint, "https://mcp.render.com/mcp");

  // Higgsfield
  const higgsfield = registry.get("higgsfield");
  assert.ok(higgsfield);
  assert.equal(higgsfield.endpoint, "https://mcp.higgsfield.ai/mcp");

  // Google Stitch
  const stitch = registry.get("stitch");
  assert.ok(stitch);
  assert.equal(stitch.endpoint, "https://stitch.googleapis.com/mcp");
});

test("IntegrationRegistry: non-destructively migrates retired Recode bridge IDs", () => {
  const registry = new IntegrationRegistry();

  // blender-recode-bridge migrates to blender-lab
  const migratedBlender = registry.get("blender-recode-bridge");
  assert.ok(migratedBlender);
  assert.equal(migratedBlender.id, "blender-lab");

  // unreal-recode-remote migrates to unreal-engine-epic
  const migratedUnreal = registry.get("unreal-recode-remote");
  assert.ok(migratedUnreal);
  assert.equal(migratedUnreal.id, "unreal-engine-epic");

  // Active list contains no recode_native replacements
  const recodeNative = registry.getByProvenance("recode_native");
  assert.equal(recodeNative.length, 0);
});
