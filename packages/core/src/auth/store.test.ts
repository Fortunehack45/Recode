import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { AuthStore } from "./store.js";

test("AuthStore stores, retrieves, and masks credentials without emails", () => {
  const tmpConfigDir = path.join(os.tmpdir(), `recode_test_auth_${Date.now()}`);
  fs.mkdirSync(tmpConfigDir, { recursive: true });
  AuthStore.setCustomPath(path.join(tmpConfigDir, "auth.json"));

  // 1. Initial status
  let config = AuthStore.load();
  assert.strictEqual(config.github, undefined);

  // 2. Set GitHub auth
  AuthStore.setGitHubAuth({
    token: "gho_testtoken1234567890",
    user: {
      login: "octocat",
      id: 583231,
      avatar_url: "https://github.com/octocat.png",
    },
    authenticated_at: new Date().toISOString(),
  });

  config = AuthStore.load();
  assert.strictEqual(config.github?.user.login, "octocat");
  assert.strictEqual(config.github?.token, "gho_testtoken1234567890");

  // 3. Set provider key
  AuthStore.setProviderKey("gemini", "AIzaSyFakeKey123456789");
  config = AuthStore.load();
  assert.strictEqual(config.providers.gemini, "AIzaSyFakeKey123456789");

  // 4. Secret masking
  assert.strictEqual(AuthStore.maskSecret("AIzaSyFakeKey123456789"), "AIza...6789");
  assert.strictEqual(AuthStore.maskSecret("short"), "********");
  assert.strictEqual(AuthStore.maskSecret(undefined), "Not set");

  // 5. Clear GitHub auth
  AuthStore.clearGitHubAuth();
  config = AuthStore.load();
  assert.strictEqual(config.github, undefined);
  assert.strictEqual(config.providers.gemini, "AIzaSyFakeKey123456789");

  // Clean up
  try {
    fs.rmSync(tmpConfigDir, { recursive: true, force: true });
  } catch {}
});
