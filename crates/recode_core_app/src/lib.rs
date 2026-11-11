// Copyright (c) 2026 Recode. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification, or redistribution is strictly prohibited.

//! Recode Core Clean-Room Unified Desktop Application Engine.
//!
//! Integrates text editing, layout docking, workspace files, LSP client,
//! terminal grid, command palette, and AI agent session into a unified coordinator.

pub mod app_state;
pub mod config;

pub use app_state::{FocusTarget, RecodeApp};
pub use config::UserConfig;

#[cfg(test)]
mod tests {
    use super::*;
    use recode_shell::DockPosition;
    use std::path::PathBuf;

    #[test]
    fn test_application_initialization_with_ollama_settings() {
        let app = RecodeApp::new(UserConfig::default());
        assert_eq!(app.config.theme, "Ayu Dark");
        assert_eq!(app.config.agent.default_model.provider, "ollama");
        assert_eq!(app.config.agent.default_model.model, "claude-fable-5.2:latest");
        assert_eq!(app.focus, FocusTarget::Editor);
    }

    #[test]
    fn test_file_opening_and_editing_flow() {
        let mut app = RecodeApp::new(UserConfig::default());

        // Open a file
        let tab_id = app.open_file("main.rs", Some(PathBuf::from("/project/src/main.rs")), "fn main() {}");
        assert_eq!(app.tabs.len(), 1);
        assert_eq!(app.tabs.active_tab().unwrap().title, "main.rs");

        // Type into the active editor
        {
            let editor = app.active_editor_mut().expect("Editor should be active");
            editor.type_text("\n// added line");
        }

        let updated_text = app.active_editor().unwrap().text();
        assert!(updated_text.contains("// added line"));

        // Close the tab
        assert!(app.close_active_tab());
        assert_eq!(app.tabs.len(), 0);
        assert!(app.open_buffers.get(&tab_id).is_none());
    }

    #[test]
    fn test_palette_modal_focus_routing() {
        let mut app = RecodeApp::new(UserConfig::default());
        assert_eq!(app.focus, FocusTarget::Editor);

        // Open palette
        app.open_palette(Some(">"));
        assert_eq!(app.focus, FocusTarget::CommandPalette);
        assert!(app.palette.is_open);

        // Close palette (Escape)
        app.close_palette();
        assert_eq!(app.focus, FocusTarget::Editor);
        assert!(!app.palette.is_open);
    }

    #[test]
    fn test_dock_toggle_updates_layout_geometry() {
        let mut app = RecodeApp::new(UserConfig::default());
        assert!(app.layout.left_dock.is_visible);

        // Toggle Left Dock closed
        app.execute_command("view.toggle_tree");
        assert!(!app.layout.left_dock.is_visible);
        assert!(app.layout.left_dock_rect().is_none());

        // Toggle Left Dock open
        app.execute_command("view.toggle_tree");
        assert!(app.layout.left_dock.is_visible);
        assert!(app.layout.left_dock_rect().is_some());
    }

    #[test]
    fn test_agent_prompt_dispatch_in_app() {
        let mut app = RecodeApp::new(UserConfig::default());
        app.agent.dispatch_prompt("Explain the clean-room architecture");

        assert_eq!(app.agent.thread.messages.len(), 1);
        assert!(app.agent.thread.messages[0].content.contains("Explain the clean-room architecture"));
    }
}
