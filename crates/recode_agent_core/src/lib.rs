// Copyright (c) 2026 Recode. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification, or redistribution is strictly prohibited.

//! Recode Core Clean-Room Agent Panel, LLM Integration, and Tools Engine.
//!
//! Provides conversation transcripts, streaming message bubbles, local Ollama integration,
//! tool registries, slash command skills, and Model Context Protocol (MCP) bridges.

pub mod mcp;
pub mod models;
pub mod session;
pub mod tools;
pub mod transcript;

pub use mcp::{McpRegistry, McpServerConfig};
pub use models::{ModelConfig, ModelProvider, TokenBudget};
pub use session::{AgentOperatingMode, AgentSession, SkillDefinition};
pub use tools::{ToolCall, ToolCallStatus, ToolDefinition, ToolRegistry};
pub use transcript::{ChatMessage, ConversationThread, MessageRole};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_ollama_local_configuration() {
        let session = AgentSession::default();
        assert_eq!(session.model_config.provider, ModelProvider::Ollama);
        assert_eq!(session.model_config.api_url, "http://localhost:11434");
        assert_eq!(session.model_config.model_name, "claude-fable-5.2:latest");
        assert_eq!(session.model_config.display_name, "Claude Fable 5.2 (Local)");
        assert!(session.model_config.api_key.is_none());
        assert_eq!(session.model_config.max_tokens, 16_384);
    }

    #[test]
    fn test_token_budget_calculation_and_exhaustion_warning() {
        let budget = TokenBudget::new(14_000, 16_384);
        assert!(budget.fraction() > 0.85);
        assert!(budget.is_exhaustion_warning());

        let low_budget = TokenBudget::new(2_000, 16_384);
        assert!(!low_budget.is_exhaustion_warning());
    }

    #[test]
    fn test_core_tools_registration() {
        let registry = ToolRegistry::with_core_tools();
        assert!(registry.get("read_file").is_some());
        assert!(registry.get("write_file").is_some());
        assert!(registry.get("edit_file").is_some());
        assert!(registry.get("list_directory").is_some());
        assert!(registry.get("run_command").is_some());

        // Destructive tools require approval
        assert!(registry.get("write_file").unwrap().requires_approval);
        assert!(registry.get("run_command").unwrap().requires_approval);
        // Read-only tools do not require approval
        assert!(!registry.get("read_file").unwrap().requires_approval);
    }

    #[test]
    fn test_slash_command_skill_dispatch() {
        let mut session = AgentSession::default();
        assert_eq!(session.mode, session::AgentOperatingMode::Normal);

        // Dispatch normal prompt
        session.dispatch_prompt("Hello assistant");
        assert_eq!(session.mode, session::AgentOperatingMode::Normal);
        assert_eq!(session.thread.messages.len(), 1);
        assert_eq!(session.thread.messages[0].content, "Hello assistant");

        // Dispatch slash command prompt: /plan
        session.dispatch_prompt("/plan build clean-room architecture");
        assert_eq!(session.mode, session::AgentOperatingMode::Plan);
        assert_eq!(session.thread.messages.len(), 3);
        let plan_user_msg = &session.thread.messages[1].content;
        assert!(plan_user_msg.contains("[MODE & SKILL: plan]"));
        assert!(plan_user_msg.contains("build clean-room architecture"));
        let plan_assistant_msg = &session.thread.messages[2].content;
        assert!(plan_assistant_msg.contains("Plan Mode activated"));

        // Dispatch slash command prompt: /agent
        session.dispatch_prompt("/agent build multiplayer social app");
        assert_eq!(session.mode, session::AgentOperatingMode::Agent);
        let agent_user_msg = &session.thread.messages[3].content;
        assert!(agent_user_msg.contains("[MODE & SKILL: agent]"));
        let agent_assistant_msg = &session.thread.messages[4].content;
        assert!(agent_assistant_msg.contains("Agent Mode activated"));

        // Switch back to normal mode
        session.dispatch_prompt("/normal");
        assert_eq!(session.mode, session::AgentOperatingMode::Normal);
        assert_eq!(session.thread.messages.last().unwrap().content, "Switched to Normal Mode (interactive single-agent assistant).");
    }

    #[test]
    fn test_tool_call_lifecycle() {
        let mut tool_call = ToolCall::new("call-1", "read_file", serde_json::json!({"path": "src/main.rs"}));
        assert_eq!(tool_call.status, ToolCallStatus::Pending);

        tool_call.complete("fn main() {}");
        assert_eq!(tool_call.status, ToolCallStatus::Completed);
        assert_eq!(tool_call.output.as_deref(), Some("fn main() {}"));
    }

    #[test]
    fn test_official_cloud_mcp_presets() {
        let registry = McpRegistry::with_official_cloud_presets();
        let supabase = registry.get_server("supabase").expect("supabase preset exists");
        assert_eq!(supabase.command, "npx");
        assert!(supabase.args.contains(&"@supabase/mcp-server".to_string()));

        let vercel = registry.get_server("vercel").expect("vercel preset exists");
        assert_eq!(vercel.command, "npx");
        assert!(vercel.args.contains(&"@vercel/mcp".to_string()));
    }
}
