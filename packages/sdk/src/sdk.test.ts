import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Recode, RecodeAuth, Tool } from "./index.js";
import { AuthStore } from "@recode/core";

test("Recode SDK initializes, creates sessions, and registers tools", async () => {
  const tmpConfig = path.join(os.tmpdir(), `recode_test_sdk_${Date.now()}`);
  fs.mkdirSync(tmpConfig, { recursive: true });
  AuthStore.setCustomPath(path.join(tmpConfig, "auth.json"));

  // 1. Recode Auth Status
  const statusBefore = RecodeAuth.status();
  assert.strictEqual(statusBefore.github, undefined);

  // 2. Set key programmatically
  RecodeAuth.setApiKey("anthropic", "sk-ant-test12345678");
  const statusAfter = RecodeAuth.status();
  assert.strictEqual(statusAfter.providers.anthropic.configured, true);
  assert.strictEqual(statusAfter.providers.anthropic.maskedKey, "sk-a...5678");

  // 3. Custom tool
  const echoTool: Tool = {
    definition: {
      name: "echo_custom",
      description: "Custom echo tool",
      parameters: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
    async execute(args) {
      return { success: true, output: `Echo: ${args.text}` };
    },
  };

  // 4. Initialize Recode SDK instance
  const recode = new Recode({
    provider: "anthropic",
    model: "claude-3-7-sonnet",
    customTools: { echo_custom: echoTool },
  });

  const session = recode.createSession();
  assert.ok(session.id.startsWith("session_"));
  const messages = session.getMessages();
  assert.strictEqual(messages.length, 1);
  assert.strictEqual(messages[0].role, "system");

  // Clean up
  try {
    fs.rmSync(tmpConfig, { recursive: true, force: true });
  } catch {}
});
