import { AuthStore, ProviderKeys } from "../auth/store.js";
import { ChatMessage, LLMRequestOptions, LLMStreamChunk, ModelInfo, ToolCall } from "./types.js";
import { resolveModel } from "./models.js";

export class LLMClient {
  private providers: ProviderKeys;

  constructor(customKeys?: ProviderKeys) {
    const auth = AuthStore.load();
    this.providers = { ...auth.providers, ...customKeys };
  }

  public getApiKey(provider: string): string | undefined {
    const raw = this.providers[provider.toLowerCase()];
    if (!raw) return undefined;
    return raw.trim().replace(/[\r\n\t]/g, "").replace(/^['"]|['"]$/g, "").replace(/^Bearer\s+/i, "");
  }

  public async *streamChat(
    messages: ChatMessage[],
    options: LLMRequestOptions = {}
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const auth = AuthStore.load();
    const modelInfo: ModelInfo = resolveModel(
      options.model || auth.default_model,
      auth.default_provider as any,
      this.providers
    );

    if (modelInfo.provider === "anthropic") {
      yield* this.streamAnthropic(messages, modelInfo, options);
    } else {
      yield* this.streamOpenAICompatible(messages, modelInfo, options);
    }
  }

  private async *streamAnthropic(
    messages: ChatMessage[],
    modelInfo: ModelInfo,
    options: LLMRequestOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const apiKey = this.getApiKey("anthropic");
    if (!apiKey) {
      throw new Error(
        `Anthropic API key not configured. Type /connect to choose a provider, or run "/connect anthropic <key>".`
      );
    }

    // Separate system message from conversation messages
    let systemPrompt: string | undefined;
    const conversationMessages: any[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt = (systemPrompt ? systemPrompt + "\n\n" : "") + msg.content;
      } else if (msg.role === "tool") {
        // Anthropic tool result format
        conversationMessages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.tool_call_id,
              content: msg.content,
            },
          ],
        });
      } else if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
        const contentBlocks: any[] = [];
        if (msg.content) {
          contentBlocks.push({ type: "text", text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          contentBlocks.push({
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }
        conversationMessages.push({
          role: "assistant",
          content: contentBlocks,
        });
      } else {
        conversationMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    const tools = options.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: modelInfo.id,
        messages: conversationMessages,
        system: systemPrompt,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.2,
        tools: tools && tools.length > 0 ? tools : undefined,
        stream: true,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error("No response body received from Anthropic");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    let currentToolCall: { id: string; name: string; argsJson: string } | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") {
          yield { type: "finish" };
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const type = parsed.type;

          if (type === "content_block_start") {
            const block = parsed.content_block;
            if (block?.type === "tool_use") {
              currentToolCall = {
                id: block.id,
                name: block.name,
                argsJson: "",
              };
            }
          } else if (type === "content_block_delta") {
            const delta = parsed.delta;
            if (delta?.type === "thinking_delta" && delta.thinking) {
              yield { type: "thinking", content: delta.thinking };
            } else if (delta?.type === "text_delta") {
              yield { type: "token", content: delta.text };
            } else if (delta?.type === "input_json_delta") {
              if (currentToolCall) {
                currentToolCall.argsJson += delta.partial_json;
              }
            }
          } else if (type === "content_block_stop") {
            if (currentToolCall) {
              let parsedArgs = {};
              try {
                parsedArgs = JSON.parse(currentToolCall.argsJson || "{}");
              } catch {
                parsedArgs = {};
              }
              yield {
                type: "tool_call_complete",
                toolCall: {
                  id: currentToolCall.id,
                  name: currentToolCall.name,
                  arguments: parsedArgs,
                },
              };
              currentToolCall = null;
            }
          } else if (type === "message_stop") {
            yield { type: "finish" };
          }
        } catch {
          // ignore transient json parse errors in stream
        }
      }
    }
  }

  private async *streamOpenAICompatible(
    messages: ChatMessage[],
    modelInfo: ModelInfo,
    options: LLMRequestOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const provider = modelInfo.provider;
    let endpoint = "https://api.openai.com/v1/chat/completions";
    let apiKey = this.getApiKey(provider);

    if (provider === "deepseek") {
      endpoint = "https://api.deepseek.com/chat/completions";
    } else if (provider === "openrouter") {
      endpoint = "https://openrouter.ai/api/v1/chat/completions";
    } else if (provider === "groq") {
      endpoint = "https://api.groq.com/openai/v1/chat/completions";
    } else if (provider === "gemini") {
      apiKey = this.getApiKey("gemini");
      endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    } else if (provider === "opencode") {
      apiKey = this.getApiKey("opencode") || process.env.OPENCODE_API_KEY;
      const customBase = process.env.OPENCODE_API_URL || process.env.RECODE_OPENCODE_URL;
      if (customBase) {
        endpoint = customBase.endsWith("/chat/completions")
          ? customBase
          : `${customBase.replace(/\/v1\/?$/, "")}/v1/chat/completions`;
      } else if (
        modelInfo.id.startsWith("go/") ||
        modelInfo.id === "go" ||
        modelInfo.name.toLowerCase().includes("opencode go")
      ) {
        endpoint = "https://opencode.ai/inference/go/openai/v1/chat/completions";
      } else {
        endpoint = "https://opencode.ai/inference/openai/v1/chat/completions";
      }
    } else if (provider === "ollama") {
      const baseUrl = this.providers.ollama_base_url || "http://localhost:11434";
      endpoint = `${baseUrl}/v1/chat/completions`;
      apiKey = apiKey || "ollama";
    }

    if (!apiKey && provider !== "ollama") {
      throw new Error(
        `No API key configured for ${provider.toUpperCase()}.\n` +
        `Type /connect to choose a provider, or run "/connect ${provider} <key>".`
      );
    }

    const headers: Record<string, string> = {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://recode.dev";
      headers["X-Title"] = "Recode Terminal";
    } else if (provider === "opencode") {
      headers["HTTP-Referer"] = "https://recode.dev";
      headers["X-Title"] = "Recode Terminal Agent";
      headers["x-opencode-session"] = `recode-${Date.now()}`;
    }

    // Format tools for OpenAI
    const tools = options.tools?.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelInfo.id,
        messages: messages.map((m) => {
          if (m.role === "tool") {
            return {
              role: "tool",
              tool_call_id: m.tool_call_id,
              content: m.content,
            };
          }
          if (m.tool_calls && m.tool_calls.length > 0) {
            return {
              role: "assistant",
              content: m.content || null,
              tool_calls: m.tool_calls.map((tc) => ({
                id: tc.id,
                type: "function",
                function: {
                  name: tc.name,
                  arguments: JSON.stringify(tc.arguments),
                },
              })),
            };
          }
          return {
            role: m.role,
            content: m.content,
          };
        }),
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.2,
        tools: tools && tools.length > 0 ? tools : undefined,
        stream: true,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 401 && provider === "opencode") {
        throw new Error(
          `OpenCode authentication failed (401: Invalid credential).\n` +
          `  Sign in and retrieve your API key from the OpenCode Console: https://opencode.ai/auth\n` +
          `  Then set your key in Recode: /connect opencode <key>`
        );
      }
      throw new Error(`${provider} API error (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error(`No response body received from ${provider}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const activeToolCalls: Map<number, { id: string; name: string; argsJson: string }> = new Map();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") {
          for (const tc of activeToolCalls.values()) {
            let parsed = {};
            try {
              parsed = JSON.parse(tc.argsJson || "{}");
            } catch {
              parsed = {};
            }
            yield {
              type: "tool_call_complete",
              toolCall: {
                id: tc.id,
                name: tc.name,
                arguments: parsed,
              },
            };
          }
          activeToolCalls.clear();
          yield { type: "finish" };
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const choice = parsed.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta;
          const reasoning = delta?.reasoning_content || delta?.reasoning || (delta as any)?.thought;
          if (reasoning) {
            yield { type: "thinking", content: reasoning };
          }
          if (delta?.content) {
            yield { type: "token", content: delta.content };
          }

          if (delta?.tool_calls) {
            for (const tcDelta of delta.tool_calls) {
              const idx = tcDelta.index ?? 0;
              let existing = activeToolCalls.get(idx);
              if (!existing) {
                existing = {
                  id: tcDelta.id || `call_${Date.now()}_${idx}`,
                  name: tcDelta.function?.name || "",
                  argsJson: "",
                };
                activeToolCalls.set(idx, existing);
              }
              if (tcDelta.id) existing.id = tcDelta.id;
              if (tcDelta.function?.name) existing.name = tcDelta.function.name;
              if (tcDelta.function?.arguments) existing.argsJson += tcDelta.function.arguments;
            }
          }

          if (choice.finish_reason === "tool_calls" || choice.finish_reason === "stop") {
            for (const tc of activeToolCalls.values()) {
              let parsedArgs = {};
              try {
                parsedArgs = JSON.parse(tc.argsJson || "{}");
              } catch {
                parsedArgs = {};
              }
              yield {
                type: "tool_call_complete",
                toolCall: {
                  id: tc.id,
                  name: tc.name,
                  arguments: parsedArgs,
                },
              };
            }
            activeToolCalls.clear();

            if (choice.finish_reason === "stop") {
              yield { type: "finish", finishReason: "stop" };
            }
          }
        } catch {
          // ignore transient json error in stream
        }
      }
    }
  }
}
