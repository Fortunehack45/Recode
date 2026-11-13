/**
 * Official Supabase Remote MCP Client
 * 
 * Canonical Endpoint: https://mcp.supabase.com/mcp
 * Documentation: https://supabase.com/docs/guides/ai-tools/mcp
 * Transport: Streamable HTTP + OAuth 2.1 + Project Scoping
 */

import { DiscoveredTool, IntegrationManifest } from "../types.js";
import { FIRST_PARTY_INTEGRATIONS } from "../registry.js";

export interface SupabaseMCPClientOptions {
  accessToken?: string;
  projectRef?: string;
  readOnly?: boolean;
  endpoint?: string;
}

export class SupabaseRemoteMCP {
  public readonly manifest: IntegrationManifest = FIRST_PARTY_INTEGRATIONS.supabase;
  private token?: string;
  private projectRef?: string;
  private readOnly: boolean;
  private endpoint: string;

  constructor(options: SupabaseMCPClientOptions = {}) {
    this.token = options.accessToken || process.env.SUPABASE_ACCESS_TOKEN;
    this.projectRef = options.projectRef || process.env.SUPABASE_PROJECT_ID;
    this.readOnly = options.readOnly ?? false;
    this.endpoint = options.endpoint || this.manifest.endpoint || "https://mcp.supabase.com/mcp";
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  public getProjectRef(): string | undefined {
    return this.projectRef;
  }

  public isReadOnly(): boolean {
    return this.readOnly;
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
   * Health check verifying endpoint reachability and credentials
   */
  public async checkHealth(): Promise<{ healthy: boolean; message: string }> {
    if (!this.isAuthenticated()) {
      return {
        healthy: false,
        message: "Supabase authentication required. Click 'Connect' to authorize via OAuth or set SUPABASE_ACCESS_TOKEN.",
      };
    }

    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: "GET",
        headers: this.getAuthorizationHeader(),
      }).catch(() => null);

      if (!response) {
        return {
          healthy: false,
          message: "Unable to reach Supabase MCP endpoint. Please check internet connection.",
        };
      }

      if (response.status === 401) {
        return {
          healthy: false,
          message: "Supabase authorization token has expired. Please re-authenticate.",
        };
      }

      return { healthy: true, message: `Connected to Supabase MCP${this.projectRef ? ` (Project: ${this.projectRef})` : ""}.` };
    } catch (err: any) {
      return { healthy: false, message: err.message };
    }
  }

  /**
   * Dynamically discovers tools by issuing tools/list to the active Supabase MCP session.
   * If readOnly is set, mutation tools are safely filtered.
   * Zero hardcoded tool definitions.
   */
  public async discoverTools(client: {
    listTools: () => Promise<{
      tools: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>;
    }>;
  }): Promise<DiscoveredTool[]> {
    const res = await client.listTools();
    if (!res || !Array.isArray(res.tools)) {
      throw new Error("Invalid tools/list response received from official Supabase MCP endpoint");
    }

    const tools = this.readOnly
      ? res.tools.filter((t) => !["apply_migration", "execute_sql"].includes(t.name.toLowerCase()))
      : res.tools;

    return tools.map((t) => ({
      name: t.name,
      namespacedName: `${this.manifest.toolNamespace}:${t.name}`,
      description: t.description || `Official Supabase tool: ${t.name}`,
      inputSchema: t.inputSchema || { type: "object", properties: {} },
      serverName: this.manifest.id,
    }));
  }
}
