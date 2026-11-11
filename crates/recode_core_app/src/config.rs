//! User settings parser, defaults generator, and in-place settings persistence.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Dock preference for panels (left or right, top or bottom).
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct DockSettings {
    pub dock: String,
}

/// Agent default model configuration in settings.json.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct AgentModelSettings {
    pub provider: String,
    pub model: String,
    #[serde(default)]
    pub enable_thinking: bool,
}

/// Agent settings block in settings.json.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct AgentSettingsBlock {
    pub default_model: AgentModelSettings,
    pub dock: String,
}

/// Ollama model entry in settings.json.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct OllamaModelEntry {
    pub name: String,
    pub display_name: String,
    pub max_tokens: usize,
}

/// Ollama settings in settings.json.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct OllamaProviderSettings {
    pub api_url: String,
    pub auto_discover: bool,
    pub available_models: Vec<OllamaModelEntry>,
}

/// Language models block in settings.json.
#[derive(Clone, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct LanguageModelsBlock {
    pub ollama: Option<OllamaProviderSettings>,
}

/// Full structure of `%APPDATA%\Recode\settings.json`.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct UserConfig {
    pub theme: String,
    pub project_panel: DockSettings,
    pub terminal: DockSettings,
    #[serde(default)]
    pub language_models: LanguageModelsBlock,
    pub agent: AgentSettingsBlock,
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}

impl Default for UserConfig {
    fn default() -> Self {
        Self {
            theme: "Ayu Dark".to_string(),
            project_panel: DockSettings {
                dock: "left".to_string(),
            },
            terminal: DockSettings {
                dock: "bottom".to_string(),
            },
            language_models: LanguageModelsBlock {
                ollama: Some(OllamaProviderSettings {
                    api_url: "http://localhost:11434".to_string(),
                    auto_discover: true,
                    available_models: vec![OllamaModelEntry {
                        name: "claude-fable-5.2:latest".to_string(),
                        display_name: "Claude Fable 5.2".to_string(),
                        max_tokens: 16_384,
                    }],
                }),
            },
            agent: AgentSettingsBlock {
                default_model: AgentModelSettings {
                    provider: "ollama".to_string(),
                    model: "claude-fable-5.2:latest".to_string(),
                    enable_thinking: false,
                },
                dock: "right".to_string(),
            },
            extra: HashMap::new(),
        }
    }
}

impl UserConfig {
    /// Deserializes settings from a JSON string, falling back to default on error.
    pub fn parse_or_default(json_str: &str) -> Self {
        serde_json::from_str(json_str).unwrap_or_default()
    }
}
