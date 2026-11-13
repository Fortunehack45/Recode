/**
 * Official Vercel Remote MCP Client
 * 
 * Canonical Endpoint: https://mcp.vercel.com
 * Documentation: https://vercel.com/docs/agent-resources/vercel-mcp
 * Transport: Streamable HTTP + OAuth 2.1
 */

import { DiscoveredTool, IntegrationManifest } from "../types.js";
import { FIRST_PARTY_INTEGRATIONS } from "../registry.js";

export interface VercelMCPClientOptions {
  accessToken?: string;
  endpoint?: string;
}

export class VercelRemoteMCP {
  public readonly manifest: IntegrationManifest = FIRST_PARTY_INTEGRATIONS.vercel;
  private token?: string;
  private endpoint: string;

  constructor(options: VercelMCPClientOptions = {}) {
    this.token = options.accessToken || process.env.VERCEL_TOKEN;
    this.endpoint = options.endpoint || this.manifest.endpoint || "https://mcp.vercel.com";
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.token && this.token.length > 0);
  }

  public getAuthorizationHeader(): Record<string, string> {
    if (!this.token) {
      return {};
    }
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  /**
   * Health check verifying endpoint reachability and token validity
   */
  public async checkHealth(): Promise<{ healthy: boolean; message: string }> {
    if (!this.isAuthenticated()) {
      return {
        healthy: false,
        message: "Vercel OAuth token required. Click 'Connect' to authenticate with Vercel.",
      };
    }

    try {
      const response = await fetch(`${this.endpoint}/healthz`, {
        method: "GET",
        headers: this.getAuthorizationHeader(),
      }).catch(() => null);

      if (!response) {
        return {
          healthy: false,
          message: "Unable to connect to https://mcp.vercel.com. Please check network connection.",
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          healthy: false,
          message: "Vercel OAuth token expired or client not authorized. Please re-authenticate.",
        };
      }

      return { healthy: true, message: "Connected to Vercel Remote MCP." };
    } catch (err: any) {
      return { healthy: false, message: err.message };
    }
  }

  /**
   * Dynamically discovers tools by issuing tools/list to the active Vercel MCP session.
   * Zero hardcoded tool definitions.
   */
  public async discoverTools(client: {
    listTools: () => Promise<{
      tools: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>;
    }>;
  }): Promise<DiscoveredTool[]> {
    const res = await client.listTools();
    if (!res || !Array.isArray(res.tools)) {
      throw new Error("Invalid tools/list response received from official Vercel MCP endpoint");
    }

    return res.tools.map((t) => ({
      name: t.name,
      namespacedName: `${this.manifest.toolNamespace}:${t.name}`,
      description: t.description || `Official Vercel tool: ${t.name}`,
      inputSchema: t.inputSchema || { type: "object", properties: {} },
      serverName: this.manifest.id,
    }));
  }
}
