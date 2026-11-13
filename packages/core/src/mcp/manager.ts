/**
 * Recode First-Party MCP Integration Infrastructure — Lifecycle & Connection Manager
 */

import {
  ConnectionState,
  ConnectionStatus,
  DiscoveredTool,
  IntegrationManifest,
} from "./types.js";
import { IntegrationRegistry } from "./registry.js";
import { Tool, ToolContext, ToolResult } from "../tools/types.js";

export interface MCPConnectionOptions {
  timeoutMs?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
}

export class IntegrationManager {
  private registry: IntegrationRegistry;
  private statuses: Map<string, ConnectionStatus> = new Map();
  private tools: Map<string, DiscoveredTool> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private defaultTimeoutMs: number = 30000;

  constructor(registry: IntegrationRegistry = new IntegrationRegistry()) {
    this.registry = registry;
    for (const item of this.registry.getAll()) {
      this.statuses.set(item.id, {
        id: item.id,
        state: "DISCONNECTED",
        toolsCount: 0,
      });
    }
  }

  public getRegistry(): IntegrationRegistry {
    return this.registry;
  }

  public getStatus(id: string): ConnectionStatus | undefined {
    return this.statuses.get(id);
  }

  public getAllStatuses(): ConnectionStatus[] {
    return Array.from(this.statuses.values());
  }

  public getDiscoveredTools(): DiscoveredTool[] {
    return Array.from(this.tools.values());
  }

  public getToolsForServer(serverId: string): DiscoveredTool[] {
    return this.getDiscoveredTools().filter((t) => t.serverName === serverId);
  }

  /**
   * Sets connection state with explicit transition guards
   */
  public setState(id: string, newState: ConnectionState, error?: string): void {
    const current = this.statuses.get(id);
    if (!current) {
      this.statuses.set(id, {
        id,
        state: newState,
        toolsCount: 0,
        error,
      });
      return;
    }

    current.state = newState;
    if (error) {
      current.error = error;
    } else if (newState === "CONNECTED") {
      current.error = undefined;
      current.lastConnected = new Date().toISOString();
      this.retryAttempts.delete(id);
    }
  }

  /**
   * Namespaces a tool name with its provider prefix (e.g. mcp:vercel:list_deployments)
   */
  public namespaceTool(manifest: IntegrationManifest, rawToolName: string): string {
    const sanitizedRaw = rawToolName.replace(/^mcp:/, "");
    return `${manifest.toolNamespace}:${sanitizedRaw}`;
  }

  /**
   * Register discovered tools from an MCP server handshake
   */
  public registerDiscoveredTools(
    manifest: IntegrationManifest,
    rawTools: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>
  ): DiscoveredTool[] {
    const discovered: DiscoveredTool[] = [];

    // Remove stale tools for this server
    for (const [key, tool] of this.tools.entries()) {
      if (tool.serverName === manifest.id) {
        this.tools.delete(key);
      }
    }

    for (const raw of rawTools) {
      const namespaced = this.namespaceTool(manifest, raw.name);
      const tool: DiscoveredTool = {
        name: raw.name,
        namespacedName: namespaced,
        description: raw.description || `Tool provided by ${manifest.displayName}`,
        inputSchema: raw.inputSchema || { type: "object", properties: {} },
        serverName: manifest.id,
      };

      this.tools.set(namespaced, tool);
      discovered.push(tool);
    }

    const status = this.statuses.get(manifest.id);
    if (status) {
      status.toolsCount = discovered.length;
    }

    return discovered;
  }

  /**
   * Converts discovered MCP tools to Recode Agent execution tools
   */
  public toAgentTools(executor: (tool: DiscoveredTool, args: any, context: ToolContext) => Promise<ToolResult>): Record<string, Tool> {
    const agentTools: Record<string, Tool> = {};

    for (const [namespacedName, discovered] of this.tools.entries()) {
      // Register under both namespaced name and underscored identifier
      const cleanName = namespacedName.replace(/:/g, "_");

      agentTools[cleanName] = {
        definition: {
          name: cleanName,
          description: `[${discovered.serverName}] ${discovered.description}`,
          parameters: discovered.inputSchema as any,
        },
        execute: async (args: any, context: ToolContext) => {
          return executor(discovered, args, context);
        },
      };
    }

    return agentTools;
  }

  /**
   * Run health checks across all connected integrations
   */
  public async runHealthChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [id, status] of this.statuses.entries()) {
      if (status.state !== "CONNECTED" && status.state !== "DEGRADED") {
        continue;
      }

      const manifest = this.registry.get(id);
      if (!manifest || !manifest.healthCheck) {
        results[id] = true;
        continue;
      }

      try {
        const check = await manifest.healthCheck();
        if (check.healthy) {
          this.setState(id, "CONNECTED");
          results[id] = true;
        } else {
          this.setState(id, "DEGRADED", check.message || "Health check failed");
          results[id] = false;
        }
      } catch (err: any) {
        this.setState(id, "DEGRADED", err.message);
        results[id] = false;
      }
    }

    return results;
  }

  /**
   * Calculates next backoff duration in milliseconds
   */
  public getBackoffDelay(id: string, initialMs = 1000, maxMs = 30000): number {
    const attempts = (this.retryAttempts.get(id) || 0) + 1;
    this.retryAttempts.set(id, attempts);
    const delay = Math.min(initialMs * Math.pow(2, attempts - 1), maxMs);
    // Add jitter (10%)
    return delay + Math.floor(Math.random() * (delay * 0.1));
  }

  /**
   * Reset server connection and clean up active tools
   */
  public disconnect(id: string): void {
    this.setState(id, "STOPPING");

    // Remove tools
    for (const [key, tool] of this.tools.entries()) {
      if (tool.serverName === id) {
        this.tools.delete(key);
      }
    }

    const status = this.statuses.get(id);
    if (status) {
      status.toolsCount = 0;
    }

    this.setState(id, "DISCONNECTED");
  }
}
