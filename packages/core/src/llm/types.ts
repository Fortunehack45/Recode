export type ProviderName =
  | "anthropic"
  | "openai"
  | "gemini"
  | "opencode"
  | "openrouter"
  | "deepseek"
  | "groq"
  | "ollama";

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderName;
  contextWindow: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  description: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMStreamChunk {
  type: "token" | "thinking" | "tool_call_delta" | "tool_call_complete" | "finish";
  content?: string;
  toolCall?: ToolCall;
  finishReason?: string;
}

export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  signal?: AbortSignal;
}
