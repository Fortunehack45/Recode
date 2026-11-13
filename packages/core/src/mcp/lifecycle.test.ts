import { test } from "node:test";
import assert from "node:assert/strict";
import { IntegrationRegistry } from "./registry.js";
import { IntegrationManager } from "./manager.js";

test("IntegrationManager: initializes with all providers in DISCONNECTED state", () => {
  const registry = new IntegrationRegistry();
  const manager = new IntegrationManager(registry);

  const statuses = manager.getAllStatuses();
  assert.equal(statuses.length, registry.getAll().length);

  for (const status of statuses) {
    assert.equal(status.state, "DISCONNECTED");
    assert.equal(status.toolsCount, 0);
  }
});

test("IntegrationManager: handles connection state transitions with guards", () => {
  const manager = new IntegrationManager();

  manager.setState("vercel", "CONNECTING");
  assert.equal(manager.getStatus("vercel")?.state, "CONNECTING");

  manager.setState("vercel", "CONNECTED");
  assert.equal(manager.getStatus("vercel")?.state, "CONNECTED");
  assert.ok(manager.getStatus("vercel")?.lastConnected);

  manager.setState("vercel", "DEGRADED", "Rate limited");
  assert.equal(manager.getStatus("vercel")?.state, "DEGRADED");
  assert.equal(manager.getStatus("vercel")?.error, "Rate limited");
});

test("IntegrationManager: namespaces tools correctly to prevent collisions", () => {
  const registry = new IntegrationRegistry();
  const manager = new IntegrationManager(registry);

  const vercelManifest = registry.get("vercel")!;
  const namespaced = manager.namespaceTool(vercelManifest, "list_deployments");
  assert.equal(namespaced, "mcp:vercel:list_deployments");

  const supabaseManifest = registry.get("supabase")!;
  const supabaseNamespaced = manager.namespaceTool(supabaseManifest, "execute_sql");
  assert.equal(supabaseNamespaced, "mcp:supabase:execute_sql");
});

test("IntegrationManager: registers discovered tools and updates count", () => {
  const registry = new IntegrationRegistry();
  const manager = new IntegrationManager(registry);
  const vercelManifest = registry.get("vercel")!;

  const discovered = manager.registerDiscoveredTools(vercelManifest, [
    {
      name: "list_deployments",
      description: "List recent deployments",
      inputSchema: { type: "object", properties: { limit: { type: "number" } } },
    },
    {
      name: "get_deployment",
      description: "Get deployment details",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  ]);

  assert.equal(discovered.length, 2);
  assert.equal(manager.getStatus("vercel")?.toolsCount, 2);
  assert.equal(manager.getToolsForServer("vercel").length, 2);
  assert.equal(discovered[0].namespacedName, "mcp:vercel:list_deployments");
});

test("IntegrationManager: converts discovered tools to Recode Agent tools", () => {
  const registry = new IntegrationRegistry();
  const manager = new IntegrationManager(registry);
  const vercelManifest = registry.get("vercel")!;

  manager.registerDiscoveredTools(vercelManifest, [
    {
      name: "deploy",
      description: "Deploy a project to Vercel",
      inputSchema: { type: "object", properties: { projectId: { type: "string" } } },
    },
  ]);

  const agentTools = manager.toAgentTools(async (tool, args) => {
    return { success: true, output: `Executed ${tool.name}` };
  });

  assert.ok(agentTools["mcp_vercel_deploy"]);
  assert.equal(agentTools["mcp_vercel_deploy"].definition.name, "mcp_vercel_deploy");
  assert.ok(agentTools["mcp_vercel_deploy"].definition.description.includes("[vercel]"));
});

test("IntegrationManager: calculates exponential backoff with jitter bounds", () => {
  const manager = new IntegrationManager();

  const delay1 = manager.getBackoffDelay("test-server", 1000, 30000);
  assert.ok(delay1 >= 1000 && delay1 <= 1200);

  const delay2 = manager.getBackoffDelay("test-server", 1000, 30000);
  assert.ok(delay2 >= 2000 && delay2 <= 2400);

  const delay3 = manager.getBackoffDelay("test-server", 1000, 30000);
  assert.ok(delay3 >= 4000 && delay3 <= 4800);
});

test("IntegrationManager: disconnect cleanly unloads tools and resets state", () => {
  const registry = new IntegrationRegistry();
  const manager = new IntegrationManager(registry);
  const vercelManifest = registry.get("vercel")!;

  manager.registerDiscoveredTools(vercelManifest, [
    { name: "test_tool", description: "Test" },
  ]);
  assert.equal(manager.getToolsForServer("vercel").length, 1);

  manager.disconnect("vercel");
  assert.equal(manager.getStatus("vercel")?.state, "DISCONNECTED");
  assert.equal(manager.getToolsForServer("vercel").length, 0);
});
