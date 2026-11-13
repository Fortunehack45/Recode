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
   * Returns canonical official tool definitions provided by Vercel MCP
   */
  public getCanonicalTools(): DiscoveredTool[] {
    const raw = [
      {
        name: "list_projects",
        description: "List all projects accessible in the authenticated Vercel account or team.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum projects to return (1-100)" },
          },
        },
      },
      {
        name: "list_deployments",
        description: "List recent deployments for a specific Vercel project with state and URLs.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID or name" },
            limit: { type: "number", description: "Number of deployments to retrieve" },
          },
          required: ["projectId"],
        },
      },
      {
        name: "get_deployment_logs",
        description: "Retrieve build, runtime, and serverless function execution logs for a Vercel deployment.",
        inputSchema: {
          type: "object",
          properties: {
            deploymentId: { type: "string", description: "Unique deployment ID" },
            follow: { type: "boolean", description: "Stream live logs" },
          },
          required: ["deploymentId"],
        },
      },
      {
        name: "get_project_env",
        description: "Retrieve project environment variables and their targets (Production, Preview, Development).",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID or name" },
          },
          required: ["projectId"],
        },
      },
    ];

    return raw.map((t) => ({
      name: t.name,
      namespacedName: `${this.manifest.toolNamespace}:${t.name}`,
      description: t.description,
      inputSchema: t.inputSchema,
      serverName: this.manifest.id,
    }));
  }
}
