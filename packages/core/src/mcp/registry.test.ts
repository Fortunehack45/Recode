import { test } from "node:test";
import assert from "node:assert";
import { IntegrationRegistry, FIRST_PARTY_INTEGRATIONS } from "./registry.js";

test("IntegrationRegistry: contains all canonical first-party providers", () => {
  const registry = new IntegrationRegistry();
  const all = registry.getAll();

  assert.ok(all.length >= 6);

  // Vercel
  const vercel = registry.get("vercel");
  assert.ok(vercel);
  assert.strictEqual(vercel.provenance, "first_party_remote");
  assert.strictEqual(vercel.transport, "streamable_http");
  assert.strictEqual(vercel.endpoint, "https://mcp.vercel.com");
  assert.strictEqual(vercel.authType, "oauth2");
  assert.strictEqual(vercel.toolNamespace, "mcp:vercel");

  // Supabase
  const supabase = registry.get("supabase");
  assert.ok(supabase);
  assert.strictEqual(supabase.provenance, "first_party_remote");
  assert.strictEqual(supabase.transport, "streamable_http");
  assert.strictEqual(supabase.endpoint, "https://mcp.supabase.com/mcp");
  assert.strictEqual(supabase.authType, "oauth2");
  assert.strictEqual(supabase.toolNamespace, "mcp:supabase");

  // Blender Lab
  const blenderLab = registry.get("blender-lab");
  assert.ok(blenderLab);
  assert.strictEqual(blenderLab.provenance, "first_party_local");
  assert.strictEqual(blenderLab.transport, "stdio");
  assert.strictEqual(blenderLab.command, "uvx");
  assert.strictEqual(blenderLab.dependencies.application?.name, "Blender");
  assert.strictEqual(blenderLab.dependencies.application?.minVersion, "5.1");

  // Blender Recode Native Bridge
  const blenderBridge = registry.get("blender-recode-bridge");
  assert.ok(blenderBridge);
  assert.strictEqual(blenderBridge.provenance, "recode_native");
  assert.strictEqual(blenderBridge.transport, "local_http");

  // Unreal Engine Epic Embedded
  const unrealEpic = registry.get("unreal-engine-epic");
  assert.ok(unrealEpic);
  assert.strictEqual(unrealEpic.provenance, "first_party_embedded");
  assert.strictEqual(unrealEpic.dependencies.application?.name, "Unreal Engine Editor");
  assert.strictEqual(unrealEpic.dependencies.application?.minVersion, "5.5");

  // Filter by provenance
  const remoteIntegrations = registry.getByProvenance("first_party_remote");
  assert.strictEqual(remoteIntegrations.some((i) => i.id === "vercel"), true);
  assert.strictEqual(remoteIntegrations.some((i) => i.id === "supabase"), true);
});
