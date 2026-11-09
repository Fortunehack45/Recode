import { AuthStore, ProviderKeys, Tool } from "@recode-dev/core";
import { Session, SessionOptions } from "./session.js";
import { RecodeAuth, AuthStatus } from "./auth.js";

export interface RecodeClientOptions {
  apiKey?: string;
  provider?: string;
  model?: string;
  workspaceDir?: string;
  providers?: ProviderKeys;
  customTools?: Record<string, Tool>;
}

export class Recode {
  public static readonly auth = RecodeAuth;
  private options: RecodeClientOptions;

  constructor(options: RecodeClientOptions = {}) {
    this.options = options;

    if (options.apiKey && options.provider) {
      AuthStore.setProviderKey(options.provider, options.apiKey);
    }
    if (options.providers) {
      for (const [p, key] of Object.entries(options.providers)) {
        if (key) AuthStore.setProviderKey(p, key);
      }
    }
  }

  public get auth(): typeof RecodeAuth {
    return RecodeAuth;
  }

  public status(): AuthStatus {
    return RecodeAuth.status();
  }

  /**
   * Create an interactive stateful session.
   */
  public createSession(sessionOptions: SessionOptions = {}): Session {
    return new Session({
      model: sessionOptions.model || this.options.model,
      workspaceDir: sessionOptions.workspaceDir || this.options.workspaceDir || process.cwd(),
      maxTurns: sessionOptions.maxTurns,
      systemPrompt: sessionOptions.systemPrompt,
      customTools: { ...this.options.customTools, ...sessionOptions.customTools },
    });
  }

  /**
   * One-shot prompt execution: runs prompt to completion and returns the final response.
   */
  public async run(
    prompt: string,
    options: SessionOptions & { signal?: AbortSignal } = {}
  ): Promise<string> {
    const session = this.createSession(options);
    return await session.execute(prompt, { signal: options.signal });
  }
}
