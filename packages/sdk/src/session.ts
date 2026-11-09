import { Agent, AgentEvent, ChatMessage, Tool } from "@recode/core";

export interface SessionOptions {
  model?: string;
  workspaceDir?: string;
  maxTurns?: number;
  systemPrompt?: string;
  customTools?: Record<string, Tool>;
}

export class Session {
  private agent: Agent;
  public readonly id: string;
  public readonly createdAt: Date;

  constructor(options: SessionOptions = {}) {
    this.id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.createdAt = new Date();
    this.agent = new Agent(options);
  }

  public get model(): string | undefined {
    return this.agent.getModel();
  }

  public get tools(): Tool[] {
    return this.agent.getTools();
  }

  public getMessages(): ChatMessage[] {
    return this.agent.getMessages();
  }

  public reset(): void {
    this.agent.clearHistory();
  }

  /**
   * Stream events for a given user prompt.
   */
  public async *prompt(
    text: string,
    options: { signal?: AbortSignal } = {}
  ): AsyncGenerator<AgentEvent, string, unknown> {
    return yield* this.agent.prompt(text, options);
  }

  /**
   * Execute a prompt and return the complete final response string.
   */
  public async execute(text: string, options: { signal?: AbortSignal } = {}): Promise<string> {
    let finalOutput = "";
    for await (const event of this.prompt(text, options)) {
      if (event.type === "done" && event.content) {
        finalOutput = event.content;
      }
    }
    return finalOutput;
  }
}
