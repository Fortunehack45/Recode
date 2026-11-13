// Auth
export { AuthStore, GitHubAuth, GitHubUser, ProviderKeys, RecodeAuthConfig } from "./auth/store.js";
export { GitHubAuthClient, DeviceCodeResponse } from "./auth/github.js";

// LLM
export { LLMClient } from "./llm/client.js";
export { DEFAULT_MODELS, resolveModel, getBestAvailableModel, PROVIDER_DEFAULT_MODELS } from "./llm/models.js";
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
  blenderExecutePythonTool,
  blenderCreateMeshTool,
  blenderExportAssetTool,
  unrealExecutePythonTool,
  unrealSpawnActorTool,
  unrealInspectWorldTool,
  mediaGenerateVideoTool,
  supabaseGenerateTypesTool,
  supabaseApplyMigrationTool,
  vercelDeployTool,
} from "./tools/builtin.js";

// Agent & Chat
export { Agent, AgentEvent, AgentEventType, AgentOptions } from "./agent/loop.js";
export { ChatStore, SavedChat, ChatMetadata } from "./agent/chat_store.js";

// Swarm
export { SwarmCoordinator } from "./swarm/coordinator.js";
export { SwarmWorker } from "./swarm/worker.js";
export { MessageBoard } from "./swarm/message_board.js";
export { WorktreeManager } from "./swarm/worktree.js";
export {
  SwarmRole,
  TaskSlice,
  TaskSliceStatus,
  SwarmMessage,
  SwarmMessageType,
  SwarmEvent,
  SwarmOptions,
} from "./swarm/types.js";

// Connectors
export { HiggsfieldClient, HiggsfieldVideoRequest, HiggsfieldTaskStatus } from "./connectors/media/higgsfield.js";
export { SupabaseConnector, SupabaseConfig } from "./connectors/cloud/supabase.js";
export { VercelConnector, VercelDeployOptions } from "./connectors/cloud/vercel.js";

// Collab
export { CollabClient, CollabMessage } from "./collab/client.js";
