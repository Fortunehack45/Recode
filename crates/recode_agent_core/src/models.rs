//! LLM providers, model specifications, local Ollama integration, and token gauges.

use serde::{Deserialize, Serialize};

/// Supported language model providers.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize)]
pub enum ModelProvider {
    Ollama,
    OpenRouter,
    OpenAI,
    Anthropic,
    Gemini,
}

impl ModelProvider {
    pub const fn label(&self) -> &'static str {
        match self {
            Self::Ollama => "Ollama (Local)",
            Self::OpenRouter => "OpenRouter",
            Self::OpenAI => "OpenAI",
            Self::Anthropic => "Anthropic",
            Self::Gemini => "Google Gemini",
        }
    }
}

/// Configuration parameters for an active language model.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct ModelConfig {
    pub provider: ModelProvider,
    pub model_name: String,
    pub display_name: String,
    pub api_url: String,
    pub api_key: Option<String>,
    pub max_tokens: usize,
    pub enable_thinking: bool,
}

impl ModelConfig {
    /// Creates the standard default configuration for local offline Ollama.
    pub fn default_local_ollama() -> Self {
        Self {
            provider: ModelProvider::Ollama,
            model_name: "claude-fable-5.2:latest".to_string(),
            display_name: "Claude Fable 5.2 (Local)".to_string(),
            api_url: "http://localhost:11434".to_string(),
            api_key: None,
            max_tokens: 16_384,
            enable_thinking: false,
        }
    }
}

/// Token consumption budget tracking for the agent context gauge.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct TokenBudget {
    pub used_tokens: usize,
    pub max_tokens: usize,
}

impl TokenBudget {
    pub const fn new(used_tokens: usize, max_tokens: usize) -> Self {
        Self {
            used_tokens,
            max_tokens,
        }
    }

    /// Usage ratio between 0.0 and 1.0.
    pub fn fraction(&self) -> f32 {
        if self.max_tokens == 0 {
            0.0
        } else {
            (self.used_tokens as f32 / self.max_tokens as f32).clamp(0.0, 1.0)
        }
    }

    /// Whether context consumption exceeds 85% of total capacity.
    pub fn is_exhaustion_warning(&self) -> bool {
        self.fraction() >= 0.85
    }
}
