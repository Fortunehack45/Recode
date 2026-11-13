//! High-level agent coordinator, slash command dispatch, and prompt context capsule.

use crate::models::{ModelConfig, TokenBudget};
use crate::tools::ToolRegistry;
use crate::transcript::ConversationThread;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Operational mode of the Recode agent session.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub enum AgentOperatingMode {
    /// Normal Mode (Default): Single-agent conversational assistant with precise surgical edits.
    #[default]
    Normal,
    /// Plan Mode: Technical architecture & systems design mode. Generates detailed implementation
    /// plan artifacts with ADRs and FMEA for user review before any code is modified.
    Plan,
    /// Agent Mode: Autonomous hierarchical multi-agent swarm orchestrating parallel subagents.
    Agent,
}

/// A registered skill accessible via slash command (e.g. `/plan`, `/rust`, `/agent`).
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct SkillDefinition {
    pub name: String,
    pub description: String,
    pub instructions: String,
}

/// The runtime agent session managing model communication, threads, and skills.
#[derive(Clone, Debug)]
pub struct AgentSession {
    pub mode: AgentOperatingMode,
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
            mode: AgentOperatingMode::Normal,
            model_config,
            thread: ConversationThread::new(1, "Main Thread"),
            tools: ToolRegistry::with_core_tools(),
            budget: TokenBudget::new(0, max_tokens),
            skills: HashMap::new(),
        };

        // Register default skills
        session.register_skill(SkillDefinition {
            name: "agent".to_string(),
            description: "Autonomous Multi-Agent Swarm Orchestrator mode".to_string(),
            instructions: "Switch to Agent Mode: Decompose goal into parallel subagents (Backend, Frontend, Algorithms, 3D, Media, DevOps, QA) with contract-first execution.".to_string(),
        });
        session.register_skill(SkillDefinition {
            name: "plan".to_string(),
            description: "Technical planning and systems architecture".to_string(),
            instructions: "Decompose problem into phased blueprints with verification gates.".to_string(),
        });
        session.register_skill(SkillDefinition {
            name: "3d-design".to_string(),
            description: "Master 3D spatial design, composition, and lighting".to_string(),
            instructions: "Design 3D scenes with three-point/HDRI lighting, camera optics, and PBR color spaces in Blender/Unreal.".to_string(),
        });
        session.register_skill(SkillDefinition {
            name: "game-development".to_string(),
            description: "Master game engine architecture, ECS, and mechanics".to_string(),
            instructions: "Enforce deterministic fixed timesteps, ECS components, Unreal Blueprints, and client-server prediction.".to_string(),
        });
        session.register_skill(SkillDefinition {
            name: "3d-modeling".to_string(),
            description: "Master 3D mesh modeling, topology, and geometry nodes".to_string(),
            instructions: "Enforce quad-dominant topology, Catmull-Clark deformation loops, and procedural Blender geometry nodes.".to_string(),
        });
        session.register_skill(SkillDefinition {
            name: "3d-animation".to_string(),
            description: "Master 3D rigging, FK/IK kinematics, and motion".to_string(),
            instructions: "Apply 12 principles of animation, FK/IK blending, F-Curve easing, and Higgsfield camera trajectories.".to_string(),
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

    /// Checks if a prompt starts with a registered slash command (e.g. `/plan`, `/agent`).
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

    /// Dispatches a user prompt into the conversation thread, activating modes and skills.
    pub fn dispatch_prompt(&mut self, prompt: &str) {
        let trimmed = prompt.trim();

        if trimmed == "/normal" {
            self.mode = AgentOperatingMode::Normal;
            self.thread.push_user("/normal");
            self.thread.push_assistant("Switched to Normal Mode (interactive single-agent assistant).");
            return;
        }

        let (final_text, mode_activation_msg) = if let Some((skill, remainder)) = self.resolve_slash_command(prompt) {
            let mode_msg = match skill.name.as_str() {
                "agent" => {
                    self.mode = AgentOperatingMode::Agent;
                    Some("Recode Agent Mode activated! Autonomous Multi-Agent Swarm Orchestrator is online.")
                }
                "plan" => {
                    self.mode = AgentOperatingMode::Plan;
                    Some("Recode Plan Mode activated! I will formulate a technical implementation plan artifact with ADRs, FMEA, and phased blueprints, and wait for your review and approval before executing.")
                }
                _ => None,
            };

            (
                format!(
                    "[{}: {}]\n{}\n\n{}",
                    if mode_msg.is_some() { "MODE & SKILL" } else { "SKILL" },
                    skill.name,
                    skill.instructions,
                    remainder
                ),
                mode_msg,
            )
        } else {
            (prompt.to_string(), None)
        };

        self.thread.push_user(&final_text);
        if let Some(msg) = mode_activation_msg {
            self.thread.push_assistant(msg);
        }
        // Estimate token cost (~4 chars per token)
        self.budget.used_tokens += final_text.len() / 4;
    }

    /// Returns list of available slash commands for UI autocomplete.
    pub fn available_skills(&self) -> Vec<&SkillDefinition> {
        self.skills.values().collect()
    }
}
