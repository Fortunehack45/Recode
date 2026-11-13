/**
 * Recode First-Party MCP Integration Infrastructure — Core Types
 */

export type IntegrationProvenance =
  | "first_party_remote"
  | "first_party_local"
  | "first_party_embedded"
  | "verified_community"
  | "recode_native";

export type TransportType = "streamable_http" | "stdio" | "local_http" | "embedded";

export type AuthType = "oauth2" | "api_key" | "local_token" | "none";

export type ConnectionState =
  | "DISCONNECTED"
  | "INSTALL_REQUIRED"
  | "AUTH_REQUIRED"
  | "CONNECTING"
  | "INITIALIZING"
  | "DISCOVERING_TOOLS"
  | "CONNECTED"
  | "DEGRADED"
  | "FAILED"
  | "STOPPING";

export interface DependencyRequirements {
  application?: {
    name: string;
    minVersion?: string;
    downloadUrl?: string;
  };
  runtime?: ("node" | "python" | "uv")[];
  extension?: {
    name: string;
    installUrl?: string;
  };
}

export interface DiscoveredTool {
  name: string;
  namespacedName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

export interface IntegrationManifest {
  id: string;
  displayName: string;
  provider: string;
  website: string;
  documentationUrl: string;
  sourceRepository?: string;
  provenance: IntegrationProvenance;
  version: string;
  supportedPlatforms: ("win32" | "darwin" | "linux")[];
  transport: TransportType;
  endpoint?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  authType: AuthType;
  oauthConfig?: {
    authorizationUrl?: string;
    tokenUrl?: string;
    scopes?: string[];
    usePkce: boolean;
    clientMetadataUrl?: string;
  };
  dependencies: DependencyRequirements;
  toolNamespace: string;
  healthCheck?: () => Promise<{ healthy: boolean; message?: string }>;
}

export interface ConnectionStatus {
  id: string;
  state: ConnectionState;
  toolsCount: number;
  lastConnected?: string;
  error?: string;
  activeProject?: string;
}
