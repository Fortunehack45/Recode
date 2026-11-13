import { ChatMessage, ToolCall } from "../llm/types.js";
import { LLMClient } from "../llm/client.js";
import { Tool, ToolContext, ToolResult } from "../tools/types.js";
import { BUILTIN_TOOLS } from "../tools/builtin.js";
import { AuthStore } from "../auth/store.js";

export type AgentEventType =
  | "start"
  | "thinking"
  | "token"
  | "tool_start"
  | "tool_end"
  | "turn_complete"
  | "error"
  | "done";

export type AgentMode = "normal" | "plan" | "agent";

export interface AgentEvent {
  type: AgentEventType;
  content?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  error?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface AgentOptions {
  model?: string;
  workspaceDir?: string;
  maxTurns?: number;
  mode?: AgentMode;
  customTools?: Record<string, Tool>;
  systemPrompt?: string;
  initialMessages?: ChatMessage[];
  signal?: AbortSignal;
}

const DEFAULT_SYSTEM_PROMPT = `You are Recode, an autonomous AI software engineering agent running in the user's terminal and SDK.
Your mission is to understand codebases, modify files, fix bugs, run commands, and write tests efficiently.

Operating Rules:
1. Always explore first: Use file_search, list_dir, and grep_search to inspect existing project structures and patterns before editing.
2. Surgical edits: Prefer edit_file with precise target strings over write_file when modifying existing files.
3. Verification: When appropriate, run commands with exec to verify your changes (tests, type checks, linting).
4. Directness: Provide concise, high-signal explanations. Do not produce verbose fluff.
5. Safety: Never destroy user code. Keep changes focused on the user's specific request.`;

export class Agent {
  private messages: ChatMessage[] = [];
  private tools: Map<string, Tool> = new Map();
  private llmClient: LLMClient;
  private workspaceDir: string;
  private model?: string;
  private maxTurns: number;
  private systemPrompt: string;
  private mode: AgentMode = "normal";

  constructor(options: AgentOptions = {}) {
    this.llmClient = new LLMClient();
    this.workspaceDir = options.workspaceDir || process.cwd();
    this.model = options.model;
    this.maxTurns = options.maxTurns || 30;
    this.mode = options.mode || "normal";
    this.systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    // Register built-in tools
    for (const [name, tool] of Object.entries(BUILTIN_TOOLS)) {
      this.tools.set(name, tool);
    }

    // Register custom tools if any
    if (options.customTools) {
      for (const [name, tool] of Object.entries(options.customTools)) {
        this.tools.set(name, tool);
      }
    }

    // Initialize messages
    if (options.initialMessages && options.initialMessages.length > 0) {
      this.messages = [...options.initialMessages];
    } else {
      this.messages.push({
        role: "system",
        content: this.systemPrompt,
      });
    }
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public setMessages(messages: ChatMessage[]): void {
    this.messages = [...messages];
    if (this.messages.length === 0 || this.messages[0].role !== "system") {
      this.messages.unshift({
        role: "system",
        content: this.systemPrompt,
      });
    }
  }

  public compactHistory(): number {
    const originalCount = this.messages.length;
    if (originalCount <= 4) return 0;

    const systemMsg = this.messages.find((m) => m.role === "system") || {
      role: "system" as const,
      content: this.systemPrompt,
    };

    // Keep the most recent 4 non-system messages
    const recent = this.messages.slice(-4);
    const older = this.messages.slice(1, -4);

    let summaryText = "[Summary of earlier conversation turns]\n";
    for (const m of older) {
      if (m.role === "user") {
        summaryText += `- User asked: ${m.content.slice(0, 120)}\n`;
      } else if (m.role === "assistant" && m.content) {
        summaryText += `- Recode response: ${m.content.slice(0, 120)}...\n`;
      }
    }

    this.messages = [
      systemMsg,
      {
        role: "user",
        content: summaryText,
      },
      {
        role: "assistant",
        content: "Understood. I have preserved context from our earlier turns.",
      },
      ...recent,
    ];

    return originalCount - this.messages.length;
  }

  public getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  public getModel(): string | undefined {
    return this.model;
  }

  public getMode(): AgentMode {
    return this.mode;
  }

  public setMode(mode: AgentMode): void {
    this.mode = mode;
  }

  public clearHistory(): void {
    this.messages = [
      {
        role: "system",
        content: this.systemPrompt,
      },
    ];
  }

  public async *prompt(
    userPrompt: string,
    options: { signal?: AbortSignal } = {}
  ): AsyncGenerator<AgentEvent, string, unknown> {
    const trimmed = userPrompt.trim();

    if (trimmed === "/normal") {
      this.mode = "normal";
      const msg = "Switched to Normal Mode (interactive single-agent assistant).";
      yield { type: "start", content: userPrompt };
      this.messages.push({ role: "user", content: userPrompt });
      this.messages.push({ role: "assistant", content: msg });
      yield { type: "turn_complete", content: msg };
      yield { type: "done" };
      return msg;
    }

    let effectivePrompt = userPrompt;
    if (trimmed.startsWith("/plan")) {
      this.mode = "plan";
      const remainder = trimmed.slice(5).trim();
      effectivePrompt = `[MODE: PLAN]\nYou are in Plan Mode. Your mandate is to research the codebase and formulate a comprehensive technical implementation plan with Architectural Decision Records (ADRs), Failure-Mode Effects Analysis (FMEA), and Phased Blueprints with verification gates.\n\nIMPORTANT: Present the plan for user review and approval before touching or modifying any code.\n\nUser Initiative: ${remainder || "Formulate technical architecture plan"}`;
    } else if (trimmed.startsWith("/agent")) {
      this.mode = "agent";
      const remainder = trimmed.slice(6).trim();
      effectivePrompt = `[MODE: AGENT]\nYou are in Agent Mode (Autonomous Multi-Agent Swarm). Decompose the initiative into specialized workstreams (Backend, Frontend, Algorithms, 3D, Media, DevOps, QA) and orchestrate execution via the shared message board and tools.\n\nUser Goal: ${remainder || "Execute autonomous swarm tasks"}`;
    }

    yield { type: "start", content: effectivePrompt };

    this.messages.push({
      role: "user",
      content: effectivePrompt,
    });

    const toolContext: ToolContext = {
      workspaceDir: this.workspaceDir,
      abortSignal: options.signal,
    };

    const toolDefs = Array.from(this.tools.values()).map((t) => t.definition);
    let turns = 0;
    let fullFinalResponse = "";

    while (turns < this.maxTurns) {
      turns++;

      let assistantResponse = "";
      const pendingToolCalls: ToolCall[] = [];

      try {
        const stream = this.llmClient.streamChat(this.messages, {
          model: this.model,
          tools: toolDefs,
          signal: options.signal,
        });

        for await (const chunk of stream) {
          if (options.signal?.aborted) {
            yield { type: "error", error: "Operation cancelled by user." };
            return assistantResponse;
          }

          if (chunk.type === "thinking" && chunk.content) {
            yield { type: "thinking", content: chunk.content };
          } else if (chunk.type === "token" && chunk.content) {
            assistantResponse += chunk.content;
            yield { type: "token", content: chunk.content };
          } else if (chunk.type === "tool_call_complete" && chunk.toolCall) {
            pendingToolCalls.push(chunk.toolCall);
          }
        }
      } catch (err: any) {
        yield { type: "error", error: err.message };
        return assistantResponse;
      }

      // Record assistant turn in message history
      this.messages.push({
        role: "assistant",
        content: assistantResponse,
        tool_calls: pendingToolCalls.length > 0 ? pendingToolCalls : undefined,
      });

      fullFinalResponse = assistantResponse;

      // If no tool calls were requested, agent turn is complete!
      if (pendingToolCalls.length === 0) {
        yield { type: "done", content: fullFinalResponse };
        return fullFinalResponse;
      }

      // Execute each tool call requested
      for (const tc of pendingToolCalls) {
        yield { type: "tool_start", toolCall: tc };

        const tool = this.tools.get(tc.name);
        let result: ToolResult;

        if (!tool) {
          result = {
            success: false,
            output: "",
            error: `Tool "${tc.name}" is not recognized.`,
          };
        } else {
          try {
            result = await tool.execute(tc.arguments, toolContext);
          } catch (execErr: any) {
            result = {
              success: false,
              output: "",
              error: execErr.message || String(execErr),
            };
          }
        }

        yield {
          type: "tool_end",
          toolCall: tc,
          toolResult: result,
        };

        // Append tool result to conversation history
        this.messages.push({
          role: "tool",
          name: tc.name,
          tool_call_id: tc.id,
          content: result.success ? result.output : `ERROR: ${result.error}\nOutput:\n${result.output}`,
        });
      }

      yield { type: "turn_complete" };
    }

    yield {
      type: "done",
      content: fullFinalResponse || "Reached max turns without final message.",
    };
    return fullFinalResponse;
  }
}
