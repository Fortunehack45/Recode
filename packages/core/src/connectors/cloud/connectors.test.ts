import { test } from "node:test";
import assert from "node:assert/strict";
import { SupabaseConnector } from "./supabase.js";
import { VercelConnector } from "./vercel.js";

test("SupabaseConnector: generateTypes throws cleanly without infinite recursion when unauthenticated", async () => {
  const connector = new SupabaseConnector({
    accessToken: "",
    projectRef: "",
  });

  await assert.rejects(
    async () => {
      await connector.generateTypes(process.cwd());
    },
    {
      name: "Error",
      message: /Supabase credentials missing/,
    }
  );
});

test("SupabaseConnector: applySqlMigration saves locally and informs user when unauthenticated", async () => {
  const connector = new SupabaseConnector({
    accessToken: "",
    projectRef: "",
  });

  const res = await connector.applySqlMigration("CREATE TABLE items (id serial PRIMARY KEY);", process.cwd());
  assert.equal(res.success, true);
  assert.ok(res.message.includes("Migration saved locally"));
  assert.ok(res.message.includes("Connect Supabase with access token"));
});

test("VercelConnector: deploy fails honestly without fake success when unauthenticated", async () => {
  const connector = new VercelConnector("");

  const res = await connector.deploy(process.cwd());
  assert.equal(res.success, false);
  assert.equal(res.url, "");
  assert.ok(res.logs?.includes("Vercel authentication required"));
});
