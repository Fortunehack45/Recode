import { test } from "node:test";
import assert from "node:assert/strict";
import { IntegrationRegistry } from "./registry.js";
import { IntegrationManager } from "./manager.js";
import { JsonRpcClient, IntegrationManifest } from "./types.js";

/**
 * In-memory Mock MCP Server Client simulating upstream JSON-RPC 2.0 communication
 */
class MockMcpServerClient implements JsonRpcClient {
  public initialized = false;
  public notificationReceived = false;
  public shouldFailHandshake = false;
  public toolsListCallCount = 0;
  public lastToolCall?: { name: string; arguments: Record<string, unknown> };

  async request<T = any>(
    method: string,
    params?: Record<string, unknown>,
    _options?: { timeoutMs?: number; signal?: AbortSignal }
  ): Promise<T> {
    if (this.shouldFailHandshake && method === "initialize") {
      throw new Error("Connection refused: upstream server rejected handshake");
    }

    if (method === "initialize") {
      this.initialized = true;
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
        serverInfo: {
          name: "mock-mcp-server",
          version: "1.0.0",
        },
      } as unknown as T;
    }

    if (method === "tools/list") {
      this.toolsListCallCount++;
      return {
        tools: [
          {
            name: "list_deployments",
            description: "List recent deployments for a project",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string" },
                limit: { type: "number" },
              },
              required: ["projectId"],
            },
          },
          {
            name: "get_deployment",
            description: "Get detailed deployment status",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string" },
              },
              required: ["id"],
            },
          },
        ],
      } as unknown as T;
    }

    if (method === "tools/call") {
      const toolName = params?.name as string;
      const toolArgs = (params?.arguments || {}) as Record<string, unknown>;
      this.lastToolCall = { name: toolName, arguments: toolArgs };

      if (toolName === "list_deployments") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                deployments: [
                  { id: "dpl_123", url: "https://my-app.vercel.app", status: "READY" },
                ],
              }),
            },
          ],
        } as unknown as T;
      }

      if (toolName === "failing_tool") {
        throw new Error("Upstream execution error: deployment not found");
      }

      return {
        content: [{ type: "text", text: "success" }],
      } as unknown as T;
    }

    throw new Error(`Unhandled JSON-RPC method: ${method}`);
  }

  async notify(method: string, _params?: Record<string, unknown>): Promise<void> {
    if (method === "notifications/initialized") {
      this.notificationReceived = true;
    }
  }
}

test("MCP Protocol Lifecycle: Full Handshake, Tool Discovery, and Execution", async () => {
  const registry = new IntegrationRegistry();
  const manager = new IntegrationManager(registry);
  const client = new MockMcpServerClient();
  const manifest = registry.get("vercel")!;

  assert.equal(manager.getStatus("vercel")?.state, "DISCONNECTED");

  // 1. Connect Client (initialize -> notify -> tools/list)
  const discovered = await manager.connectClient(manifest, client);

  assert.ok(client.initialized, "Server received initialize request");
  assert.ok(client.notificationReceived, "Server received initialized notification");
  assert.equal(client.toolsListCallCount, 1, "Server queried for tools list");

  // Verify connection state & discovered tools
  assert.equal(manager.getStatus("vercel")?.state, "CONNECTED");
  assert.equal(manager.getStatus("vercel")?.toolsCount, 2);
  assert.equal(discovered.length, 2);
  assert.equal(discovered[0].namespacedName, "mcp:vercel:list_deployments");
  assert.equal(discovered[1].namespacedName, "mcp:vercel:get_deployment");

  // 2. Live Tool Execution via executeTool
  const result = await manager.executeTool(
    "mcp:vercel:list_deployments",
    { projectId: "prj_abc" },
    client
  );

  assert.equal(result.success, true);
  assert.ok(client.lastToolCall);
  assert.equal(client.lastToolCall?.name, "list_deployments");
  assert.deepEqual(client.lastToolCall?.arguments, { projectId: "prj_abc" });

  // 3. Execution of unregistered tool returns error gracefully
  const unknownResult = await manager.executeTool(
    "mcp:vercel:nonexistent_tool",
    {},
    client
  );
  assert.equal(unknownResult.success, false);
  assert.ok(unknownResult.error?.includes("not registered"));

  // 4. Disconnect cleans up tools and resets status
  manager.disconnect("vercel");
  assert.equal(manager.getStatus("vercel")?.state, "DISCONNECTED");
  assert.equal(manager.getStatus("vercel")?.toolsCount, 0);
  assert.equal(manager.getToolsForServer("vercel").length, 0);
});

test("MCP Protocol Lifecycle: Handshake Rejection Transitions to FAILED State", async () => {
  const registry = new IntegrationRegistry();
  const manager = new IntegrationManager(registry);
  const client = new MockMcpServerClient();
  client.shouldFailHandshake = true;
  const manifest = registry.get("supabase")!;

  await assert.rejects(
    async () => {
      await manager.connectClient(manifest, client);
    },
    /Connection refused/
  );

  assert.equal(manager.getStatus("supabase")?.state, "FAILED");
  assert.ok(manager.getStatus("supabase")?.error?.includes("Connection refused"));
  assert.equal(manager.getStatus("supabase")?.toolsCount, 0);
});
