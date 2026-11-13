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
   * Returns canonical official tools exposed by Supabase MCP
   */
  public getCanonicalTools(): DiscoveredTool[] {
    const raw = [
      {
        name: "list_tables",
        description: "List all PostgreSQL tables, columns, constraints, and Row-Level Security (RLS) policies in the project schema.",
        inputSchema: {
          type: "object",
          properties: {
            schema: { type: "string", description: "Database schema name (default: public)" },
          },
        },
      },
      {
        name: "execute_sql",
        description: "Execute read or write SQL statements against the Supabase PostgreSQL database. Destructive operations require confirmation.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "PostgreSQL query or transaction block" },
          },
          required: ["query"],
        },
      },
      {
        name: "list_migrations",
        description: "List applied and pending database migrations for the active Supabase project.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "apply_migration",
        description: "Apply a versioned SQL migration to the Supabase database and record it in schema history.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Migration name (e.g. create_users_table)" },
            sql: { type: "string", description: "SQL migration contents" },
          },
          required: ["name", "sql"],
        },
      },
      {
        name: "generate_typescript_types",
        description: "Generate strongly typed TypeScript interfaces directly from the Supabase PostgreSQL catalog.",
        inputSchema: {
          type: "object",
          properties: {
            outputPath: { type: "string", description: "Target file path in workspace" },
          },
        },
      },
      {
        name: "get_advisors",
        description: "Get security and performance recommendations for database tables and RLS configurations.",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["security", "performance"], description: "Advisor category" },
          },
        },
      },
    ];

    // If configured as readOnly, filter out mutation tools
    const filtered = this.readOnly
      ? raw.filter((t) => t.name !== "apply_migration" && t.name !== "execute_sql")
      : raw;

    return filtered.map((t) => ({
      name: t.name,
      namespacedName: `${this.manifest.toolNamespace}:${t.name}`,
      description: t.description,
      inputSchema: t.inputSchema,
      serverName: this.manifest.id,
    }));
  }
}
