import test from "node:test";
import assert from "node:assert";
import { resolveModel, getBestAvailableModel, DEFAULT_MODELS } from "./models.js";

test("OpenCode models and aliases resolve correctly", () => {
  // 1. Exact alias
  const zen = resolveModel("opencode-zen");
  assert.strictEqual(zen.provider, "opencode");
  assert.strictEqual(zen.id, "claude-sonnet-4-5");

  const go = resolveModel("opencode-go");
  assert.strictEqual(go.provider, "opencode");
  assert.strictEqual(go.id, "deepseek-v4.1-flash");

  // 2. Short aliases
  assert.strictEqual(resolveModel("opencode").id, "claude-sonnet-4-5");
  assert.strictEqual(resolveModel("zen").id, "claude-sonnet-4-5");
  assert.strictEqual(resolveModel("go").id, "deepseek-v4.1-flash");

  // 3. Dynamic opencode/ prefix
  const custom = resolveModel("opencode/glm-5.2");
  assert.strictEqual(custom.provider, "opencode");
  assert.strictEqual(custom.id, "glm-5.2");

  const sonnet = resolveModel("opencode/claude-sonnet-4-5");
  assert.strictEqual(sonnet.provider, "opencode");
  assert.strictEqual(sonnet.id, "claude-sonnet-4-5");

  const dynamic = resolveModel("opencode/custom-research-model");
  assert.strictEqual(dynamic.provider, "opencode");
  assert.strictEqual(dynamic.id, "custom-research-model");

  // 4. getBestAvailableModel detects opencode provider
  const best = getBestAvailableModel({ opencode: "opencode-key-123" });
  assert.strictEqual(best?.provider, "opencode");
  assert.strictEqual(best?.id, "claude-sonnet-4-5");
});
