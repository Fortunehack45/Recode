import { ModelInfo, ProviderName } from "./types.js";

export const DEFAULT_MODELS: Record<string, ModelInfo> = {
  // Anthropic
  "claude-3-7-sonnet": {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet (Hybrid Reasoning)",
    provider: "anthropic",
    contextWindow: 200000,
    supportsTools: true,
    supportsStreaming: true,
    description: "Anthropic's latest hybrid reasoning flagship model for coding.",
  },
  "claude-3-5-sonnet": {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    contextWindow: 200000,
    supportsTools: true,
    supportsStreaming: true,
    description: "Industry-standard benchmark model for code generation and agentic tasks.",
  },
  "claude-3-5-haiku": {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    contextWindow: 200000,
    supportsTools: true,
    supportsStreaming: true,
    description: "Ultra-fast lightweight model for quick edits and completions.",
  },

  // OpenAI
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextWindow: 128000,
    supportsTools: true,
    supportsStreaming: true,
    description: "OpenAI's high-intelligence flagship omni model.",
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextWindow: 128000,
    supportsTools: true,
    supportsStreaming: true,
    description: "Fast, cost-effective model for routine tasks.",
  },
  "o3-mini": {
    id: "o3-mini",
    name: "o3-mini",
    provider: "openai",
    contextWindow: 200000,
    supportsTools: true,
    supportsStreaming: true,
    description: "OpenAI reasoning model optimized for coding and STEM.",
  },

  // Google Gemini
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    contextWindow: 1048576,
    supportsTools: true,
    supportsStreaming: true,
    description: "Google's 1M token context window model with fast multi-modal inference.",
  },
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    contextWindow: 2097152,
    supportsTools: true,
    supportsStreaming: true,
    description: "Google's highest-capability reasoning model with 2M token context.",
  },

  // DeepSeek
  "deepseek-chat": {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "deepseek",
    contextWindow: 64000,
    supportsTools: true,
    supportsStreaming: true,
    description: "DeepSeek V3 671B MoE model.",
  },
  "deepseek-reasoner": {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "deepseek",
    contextWindow: 64000,
    supportsTools: true,
    supportsStreaming: true,
    description: "DeepSeek R1 reasoning model with chain-of-thought.",
  },

  // Groq
  "llama-3.3-70b": {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    provider: "groq",
    contextWindow: 128000,
    supportsTools: true,
    supportsStreaming: true,
    description: "Ultra-fast inference via Groq LPU engine.",
  },

  // Ollama
  "ollama-local": {
    id: "qwen2.5-coder:14b",
    name: "Local Ollama (Qwen2.5-Coder)",
    provider: "ollama",
    contextWindow: 32768,
    supportsTools: true,
    supportsStreaming: true,
    description: "100% offline private local LLM running on your GPU/CPU.",
  },
};

export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o",
  anthropic: "claude-3-7-sonnet",
  deepseek: "deepseek-chat",
  groq: "llama-3.3-70b",
  ollama: "ollama-local",
  openrouter: "claude-3-5-sonnet",
};

export function getBestAvailableModel(providers?: Record<string, string | undefined>): ModelInfo | undefined {
  const check = (p: string) => {
    const envKey = `${p.toUpperCase()}_API_KEY`;
    return Boolean(providers?.[p] || process.env[envKey]);
  };

  if (check("gemini")) return DEFAULT_MODELS["gemini-2.5-flash"];
  if (check("openai")) return DEFAULT_MODELS["gpt-4o"];
  if (check("anthropic")) return DEFAULT_MODELS["claude-3-7-sonnet"];
  if (check("deepseek")) return DEFAULT_MODELS["deepseek-chat"];
  if (check("groq")) return DEFAULT_MODELS["llama-3.3-70b"];
  if (check("openrouter")) return DEFAULT_MODELS["claude-3-5-sonnet"];
  if (providers?.["ollama_base_url"] || process.env.OLLAMA_HOST) return DEFAULT_MODELS["ollama-local"];

  return undefined;
}

export function resolveModel(
  modelAliasOrId?: string,
  defaultProvider?: ProviderName,
  configuredProviders?: Record<string, string | undefined>
): ModelInfo {
  if (!modelAliasOrId) {
    if (defaultProvider && PROVIDER_DEFAULT_MODELS[defaultProvider]) {
      return DEFAULT_MODELS[PROVIDER_DEFAULT_MODELS[defaultProvider]];
    }
    const best = getBestAvailableModel(configuredProviders);
    if (best) return best;
    return DEFAULT_MODELS["gemini-2.5-flash"] || DEFAULT_MODELS["claude-3-7-sonnet"];
  }

  // Exact match on alias key
  if (DEFAULT_MODELS[modelAliasOrId]) {
    return DEFAULT_MODELS[modelAliasOrId];
  }

  // Check by model ID
  for (const model of Object.values(DEFAULT_MODELS)) {
    if (model.id.toLowerCase() === modelAliasOrId.toLowerCase()) {
      return model;
    }
  }

  // Provider-prefixed inference (e.g. "openrouter/meta-llama/llama-3-70b")
  if (modelAliasOrId.includes("/")) {
    const [p, ...rest] = modelAliasOrId.split("/");
    const id = rest.join("/");
    return {
      id,
      name: modelAliasOrId,
      provider: (p.toLowerCase() as ProviderName) || "openrouter",
      contextWindow: 128000,
      supportsTools: true,
      supportsStreaming: true,
      description: `Custom model ${modelAliasOrId}`,
    };
  }

  // Fallback as custom model on default provider
  return {
    id: modelAliasOrId,
    name: modelAliasOrId,
    provider: defaultProvider || "gemini",
    contextWindow: 128000,
    supportsTools: true,
    supportsStreaming: true,
    description: `Custom model: ${modelAliasOrId}`,
  };
}
