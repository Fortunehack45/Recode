// Auth
export { AuthStore, GitHubAuth, GitHubUser, ProviderKeys, RecodeAuthConfig } from "./auth/store.js";
export { GitHubAuthClient, DeviceCodeResponse } from "./auth/github.js";

// LLM
export { LLMClient } from "./llm/client.js";
export { DEFAULT_MODELS, resolveModel } from "./llm/models.js";
export {
  ChatMessage,
  LLMRequestOptions,
  LLMStreamChunk,
  ModelInfo,
  ProviderName,
  ToolCall,
  ToolDefinition,
} from "./llm/types.js";

// Tools
export { Tool, ToolContext, ToolResult } from "./tools/types.js";
export {
  BUILTIN_TOOLS,
  readFileTool,
  writeFileTool,
  editFileTool,
  listDirTool,
  fileSearchTool,
  grepSearchTool,
  execTool,
} from "./tools/builtin.js";

// Agent
export { Agent, AgentEvent, AgentEventType, AgentOptions } from "./agent/loop.js";

// Collab
export { CollabClient, CollabMessage } from "./collab/client.js";
