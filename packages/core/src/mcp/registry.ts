/**
 * Recode First-Party MCP Integration Infrastructure — Official Registry
 * 
 * Provides verified metadata, endpoints, provenance classifications, and
 * configuration schemas for official and native integrations.
 */

import { IntegrationManifest } from "./types.js";

export const FIRST_PARTY_INTEGRATIONS: Record<string, IntegrationManifest> = {
  vercel: {
    id: "vercel",
    displayName: "Vercel Remote MCP",
    provider: "Vercel",
    website: "https://vercel.com",
    documentationUrl: "https://vercel.com/docs/agent-resources/vercel-mcp",
    provenance: "first_party_remote",
    version: "1.0.0",
    supportedPlatforms: ["win32", "darwin", "linux"],
    transport: "streamable_http",
    endpoint: "https://mcp.vercel.com",
    authType: "oauth2",
    oauthConfig: {
      usePkce: true,
      clientMetadataUrl: "https://github.com/Fortunehack45/Recode/raw/main/oauth/client-metadata.json",
    },
    dependencies: {},
    toolNamespace: "mcp:vercel",
  },

  supabase: {
    id: "supabase",
    displayName: "Supabase Remote MCP",
    provider: "Supabase",
    website: "https://supabase.com",
    documentationUrl: "https://supabase.com/docs/guides/ai-tools/mcp",
    provenance: "first_party_remote",
    version: "1.0.0",
    supportedPlatforms: ["win32", "darwin", "linux"],
    transport: "streamable_http",
    endpoint: "https://mcp.supabase.com/mcp",
    authType: "oauth2",
    oauthConfig: {
      usePkce: true,
    },
    dependencies: {},
    toolNamespace: "mcp:supabase",
  },

  "blender-lab": {
    id: "blender-lab",
    displayName: "Blender Lab Official MCP",
    provider: "Blender / Blender Lab",
    website: "https://www.blender.org",
    documentationUrl: "https://www.blender.org/lab/mcp-server/",
    sourceRepository: "https://projects.blender.org/lab/blender_mcp",
    provenance: "first_party_local",
    version: "1.0.0",
    supportedPlatforms: ["win32", "darwin", "linux"],
    transport: "stdio",
    command: "uvx",
    args: ["blender-mcp"],
    authType: "none",
    dependencies: {
      application: {
        name: "Blender",
        minVersion: "5.1",
        downloadUrl: "https://www.blender.org/download/",
      },
      runtime: ["uv", "python"],
      extension: {
        name: "Blender Lab MCP Extension",
        installUrl: "https://projects.blender.org/lab/blender_mcp",
      },
    },
    toolNamespace: "mcp:blender",
  },

  "blender-recode-bridge": {
    id: "blender-recode-bridge",
    displayName: "Recode 3D Studio Bridge (Blender)",
    provider: "Recode",
    website: "https://recode.dev",
    documentationUrl: "https://recode.dev/docs/3d/blender",
    provenance: "recode_native",
    version: "1.30.12",
    supportedPlatforms: ["win32", "darwin", "linux"],
    transport: "local_http",
    endpoint: "http://127.0.0.1:8128",
    authType: "local_token",
    dependencies: {
      application: {
        name: "Blender",
        minVersion: "3.6",
        downloadUrl: "https://www.blender.org/download/",
      },
    },
    toolNamespace: "mcp:recode:blender",
  },

  "unreal-engine-epic": {
    id: "unreal-engine-epic",
    displayName: "Unreal Engine Embedded MCP",
    provider: "Epic Games",
    website: "https://www.unrealengine.com",
    documentationUrl: "https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor",
    provenance: "first_party_embedded",
    version: "5.5.0",
    supportedPlatforms: ["win32", "darwin", "linux"],
    transport: "embedded",
    authType: "none",
    dependencies: {
      application: {
        name: "Unreal Engine Editor",
        minVersion: "5.5",
        downloadUrl: "https://www.unrealengine.com",
      },
      extension: {
        name: "Unreal MCP Editor Plugin",
      },
    },
    toolNamespace: "mcp:unreal",
  },

  "unreal-recode-remote": {
    id: "unreal-recode-remote",
    displayName: "Recode Unreal Web Remote Control",
    provider: "Recode",
    website: "https://recode.dev",
    documentationUrl: "https://recode.dev/docs/3d/unreal",
    provenance: "recode_native",
    version: "1.30.12",
    supportedPlatforms: ["win32", "darwin"],
    transport: "local_http",
    endpoint: "http://127.0.0.1:30010",
    authType: "none",
    dependencies: {
      application: {
        name: "Unreal Engine Editor",
        minVersion: "5.0",
      },
    },
    toolNamespace: "mcp:recode:unreal",
  },

  github: {
    id: "github",
    displayName: "GitHub Official MCP",
    provider: "GitHub",
    website: "https://github.com",
    documentationUrl: "https://github.com/github/github-mcp-server",
    sourceRepository: "https://github.com/github/github-mcp-server",
    provenance: "first_party_local",
    version: "1.0.0",
    supportedPlatforms: ["win32", "darwin", "linux"],
    transport: "stdio",
    command: "gh",
    args: ["mcp-server"],
    authType: "api_key",
    dependencies: {
      runtime: ["node"],
    },
    toolNamespace: "mcp:github",
  },

  docker: {
    id: "docker",
    displayName: "Docker MCP Server",
    provider: "Docker",
    website: "https://www.docker.com",
    documentationUrl: "https://docs.docker.com",
    provenance: "first_party_local",
    version: "1.0.0",
    supportedPlatforms: ["win32", "darwin", "linux"],
    transport: "stdio",
    command: "docker",
    args: ["mcp-server"],
    authType: "none",
    dependencies: {
      application: {
        name: "Docker Desktop / Docker Engine",
      },
    },
    toolNamespace: "mcp:docker",
  },
};

export class IntegrationRegistry {
  private integrations: Map<string, IntegrationManifest> = new Map();

  constructor() {
    for (const [id, manifest] of Object.entries(FIRST_PARTY_INTEGRATIONS)) {
      this.integrations.set(id, manifest);
    }
  }

  public get(id: string): IntegrationManifest | undefined {
    return this.integrations.get(id);
  }

  public getAll(): IntegrationManifest[] {
    return Array.from(this.integrations.values());
  }

  public getByProvenance(provenance: IntegrationManifest["provenance"]): IntegrationManifest[] {
    return this.getAll().filter((i) => i.provenance === provenance);
  }

  public register(manifest: IntegrationManifest): void {
    this.integrations.set(manifest.id, manifest);
  }
}
