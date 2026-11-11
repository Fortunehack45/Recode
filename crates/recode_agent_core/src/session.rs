//! High-level agent coordinator, slash command dispatch, and prompt context capsule.

use crate::models::{ModelConfig, TokenBudget};
use crate::tools::ToolRegistry;
use crate::transcript::ConversationThread;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A registered skill accessible via slash command (e.g. `/plan`, `/rust`).
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct SkillDefinition {
    pub name: String,
    pub description: String,
    pub instructions: String,
}

/// The runtime agent session managing model communication, threads, and skills.
#[derive(Clone, Debug)]
pub struct AgentSession {
    pub model_config: ModelConfig,
    pub thread: ConversationThread,
    pub tools: ToolRegistry,
    pub budget: TokenBudget,
    skills: HashMap<String, SkillDefinition>,
}

impl Default for AgentSession {
    fn default() -> Self {
        Self::new(ModelConfig::default_local_ollama())
    }
}

impl AgentSession {
    pub fn new(model_config: ModelConfig) -> Self {
        let max_tokens = model_config.max_tokens;
        let mut session = Self {
            model_config,
            thread: ConversationThread::new(1, "Main Thread"),
            tools: ToolRegistry::with_core_tools(),
            budget: TokenBudget::new(0, max_tokens),
            skills: HashMap::new(),
        };

        // Register default skills
        session.register_skill(SkillDefinition {
            name: "plan".to_string(),
            description: "Technical planning and systems architecture".to_string(),
            instructions: "Decompose problem into phased blueprints with verification gates.".to_string(),
        });
        session.register_skill(SkillDefinition {
            name: "rust".to_string(),
            description: "Master-level Rust systems engineering".to_string(),
            instructions: "Enforce zero-copy, lifetime mechanics, and pattern matching.".to_string(),
        });

        session
    }

    /// Registers a skill for slash command execution.
    pub fn register_skill(&mut self, skill: SkillDefinition) {
        self.skills.insert(skill.name.clone(), skill);
    }

    /// Checks if a prompt starts with a registered slash command (e.g. `/plan`).
    pub fn resolve_slash_command<'a>(&'a self, prompt: &'a str) -> Option<(&'a SkillDefinition, &'a str)> {
        let trimmed = prompt.trim_start();
        if !trimmed.starts_with('/') {
            return None;
        }

        let cmd_end = trimmed.find(char::is_whitespace).unwrap_or(trimmed.len());
        let cmd_name = &trimmed[1..cmd_end];
        let remainder = trimmed[cmd_end..].trim();

        let skill = self.skills.get(cmd_name)?;
        Some((skill, remainder))
    }

    /// Dispatches a user prompt into the conversation thread, resolving skills if present.
    pub fn dispatch_prompt(&mut self, prompt: &str) {
        let final_text = if let Some((skill, remainder)) = self.resolve_slash_command(prompt) {
            format!("[SKILL: {}]\n{}\n\n{}", skill.name, skill.instructions, remainder)
        } else {
            prompt.to_string()
        };

        self.thread.push_user(&final_text);
        // Estimate token cost (~4 chars per token)
        self.budget.used_tokens += final_text.len() / 4;
    }

    /// Returns list of available slash commands for UI autocomplete.
    pub fn available_skills(&self) -> Vec<&SkillDefinition> {
        self.skills.values().collect()
    }
}
