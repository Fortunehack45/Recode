export { Recode, RecodeClientOptions } from "./client.js";
export { Session, SessionOptions } from "./session.js";
export { RecodeAuth, AuthStatus } from "./auth.js";

// Re-export core types for developer convenience
export {
  Tool,
  ToolContext,
  ToolResult,
  AgentEvent,
  AgentEventType,
  ChatMessage,
  ModelInfo,
  ProviderName,
  ToolCall,
  ToolDefinition,
  DeviceCodeResponse,
  GitHubAuth,
  GitHubUser,
  GitHubAuthClient,
  DEFAULT_MODELS,
  resolveModel,
  getBestAvailableModel,
  PROVIDER_DEFAULT_MODELS,
} from "@recode-dev/core";
