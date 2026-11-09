import { ToolDefinition } from "../llm/types.js";

export interface ToolContext {
  workspaceDir: string;
  abortSignal?: AbortSignal;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface Tool {
  definition: ToolDefinition;
  execute(args: any, context: ToolContext): Promise<ToolResult>;
}
