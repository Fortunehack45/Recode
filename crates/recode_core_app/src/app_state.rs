//! Top-level application state uniting workspace, editor tabs, shell layout, and agent session.

use crate::config::UserConfig;
use recode_agent_core::AgentSession;
use recode_buffer::EditorSession;
use recode_shell::{AppTheme, DockPosition, LayoutTopology, TabStrip, ThemeEngine};
use recode_terminal_palette::{CommandPalette, PaletteItem, PaletteItemKind, TerminalTabSession};
use recode_workspace::Workspace;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// The UI component currently holding keyboard input focus.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum FocusTarget {
    Editor,
    FileTree,
    Terminal,
    AgentInput,
    CommandPalette,
}

/// The root coordinator of the Recode desktop application.
#[derive(Clone, Debug)]
pub struct RecodeApp {
    pub config: UserConfig,
    pub layout: LayoutTopology,
    pub theme_engine: ThemeEngine,
    pub workspace: Workspace,
    pub tabs: TabStrip,
    pub open_buffers: HashMap<u64, EditorSession>,
    pub terminal_tabs: Vec<TerminalTabSession>,
    pub palette: CommandPalette,
    pub agent: AgentSession,
    pub focus: FocusTarget,
}

impl RecodeApp {
    /// Constructs a clean application instance initialized from user configuration.
    pub fn new(config: UserConfig) -> Self {
        let mut palette = CommandPalette::new();
        palette.set_items(Self::default_palette_commands());

        let mut app = Self {
            config,
            layout: LayoutTopology::default(),
            theme_engine: ThemeEngine::new(AppTheme::default_dark()),
            workspace: Workspace::new(),
            tabs: TabStrip::new(),
            open_buffers: HashMap::new(),
            terminal_tabs: vec![TerminalTabSession::new(1, "Terminal 1", 80, 24)],
            palette,
            agent: AgentSession::default(),
            focus: FocusTarget::Editor,
        };

        app
    }

    fn default_palette_commands() -> Vec<PaletteItem> {
        vec![
            PaletteItem::new("file.save", "File: Save", PaletteItemKind::Command, Some("Ctrl+S")),
            PaletteItem::new("file.close", "File: Close Tab", PaletteItemKind::Command, Some("Ctrl+W")),
            PaletteItem::new("editor.format", "Editor: Format Document", PaletteItemKind::Command, Some("Shift+Alt+F")),
            PaletteItem::new("view.toggle_tree", "View: Toggle Left Dock", PaletteItemKind::Command, Some("Ctrl+B")),
            PaletteItem::new("view.toggle_agent", "View: Toggle Agent Panel", PaletteItemKind::Command, Some("Ctrl+Alt+B")),
            PaletteItem::new("view.toggle_terminal", "View: Toggle Terminal", PaletteItemKind::Command, Some("Ctrl+`")),
        ]
    }

    /// Opens a project root folder into the workspace.
    pub fn open_project_folder(&mut self, name: impl Into<String>, path: PathBuf) {
        self.workspace.add_root(name, path);
    }

    /// Opens a file into an editor tab and allocates a dedicated `EditorSession`.
    pub fn open_file(&mut self, title: impl Into<String>, path: Option<PathBuf>, content: &str) -> u64 {
        let title_str = title.into();
        let path_str = path.as_ref().map(|p| p.to_string_lossy().into_owned());

        let tab_id = self.tabs.open_tab(title_str, path_str);
        let session = EditorSession::new(content);
        self.open_buffers.insert(tab_id, session);
        self.focus = FocusTarget::Editor;
        tab_id
    }

    /// Returns a reference to the active editor session, if a tab is open.
    pub fn active_editor(&self) -> Option<&EditorSession> {
        let active_tab = self.tabs.active_tab()?;
        self.open_buffers.get(&active_tab.id)
    }

    /// Returns a mutable reference to the active editor session.
    pub fn active_editor_mut(&mut self) -> Option<&mut EditorSession> {
        let tab_id = self.tabs.active_tab()?.id;
        self.open_buffers.get_mut(&tab_id)
    }

    /// Closes the currently active tab.
    pub fn close_active_tab(&mut self) -> bool {
        let Some(active_idx) = self.tabs.active_index() else {
            return false;
        };

        if let Some(removed_tab) = self.tabs.close_tab(active_idx) {
            self.open_buffers.remove(&removed_tab.id);
            true
        } else {
            false
        }
    }

    /// Toggles visibility of a docking panel.
    pub fn toggle_dock(&mut self, position: DockPosition) {
        match position {
            DockPosition::Left => {
                self.layout.left_dock.toggle();
            }
            DockPosition::Right => {
                self.layout.right_dock.toggle();
            }
            DockPosition::Bottom => {
                self.layout.bottom_dock.toggle();
            }
        }
    }

    /// Opens the floating Command Palette overlay.
    pub fn open_palette(&mut self, prefix: Option<&str>) {
        self.palette.open(prefix);
        self.focus = FocusTarget::CommandPalette;
    }

    /// Dismisses the Command Palette overlay (Escape).
    pub fn close_palette(&mut self) {
        self.palette.close();
        self.focus = FocusTarget::Editor;
    }

    /// Executes a global shortcut command.
    pub fn execute_command(&mut self, command_id: &str) -> bool {
        match command_id {
            "view.toggle_tree" => {
                self.toggle_dock(DockPosition::Left);
                true
            }
            "view.toggle_agent" => {
                self.toggle_dock(DockPosition::Right);
                true
            }
            "view.toggle_terminal" => {
                self.toggle_dock(DockPosition::Bottom);
                true
            }
            "file.close" => self.close_active_tab(),
            "editor.format" => {
                // If LSP available or basic indentation
                if let Some(editor) = self.active_editor_mut() {
                    editor.select_all();
                    editor.indent();
                }
                true
            }
            _ => false,
        }
    }
}
