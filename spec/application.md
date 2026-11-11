# Observable Behavior Specification: Top-Level Application Composition

## 1. Application Lifecycle & Startup Sequence

The top-level application crate (`recode_app`) orchestrates all clean-room modules into a single unified desktop experience.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RECODE APPLICATION CORE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Configuration & Settings:                                                │
│    Reads settings from user profile (`%APPDATA%\Recode\settings.json`).      │
│    Initializes ThemeEngine with active theme (default: "Ayu Dark").         │
│                                                                             │
│ 2. Window & Dock Layout:                                                    │
│    Instantiates LayoutTopology (Title Bar, Left Dock, Center Editor Canvas, │
│    Right Dock, Bottom Dock, Status Bar).                                    │
│                                                                             │
│ 3. Workspace & Buffer Coordination:                                         │
│    Loads target project directory into FileTree.                            │
│    Coordinates active buffer tabs with LanguageClient diagnostics.          │
│                                                                             │
│ 4. Subsystems Integration:                                                  │
│    Wires CommandPalette modal overlay across global keybindings.            │
│    Connects TerminalGrid in bottom dock to system shell.                    │
│    Initializes AgentSession wired to local Ollama (Claude Fable 5.2).       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Startup Invariants
* **Settings Precedence**:
  * Loads `settings.json` from user profile on startup.
  * If file is absent, creates default configuration cleanly.
* **Workspace Restoration**:
  * Re-opens the previous project folder and previously open tabs if configured.
  * If launched with a path argument (e.g. `recode .`), opens that directory as active workspace root.
  * If launched with no arguments and no previous session, renders an empty workspace with centered shortcut watermark hints.

### 1.2 Event Dispatch & Global Keymap Hierarchy
Key events route down a strict priority cascade:
1. **Modal Overlays (Highest Priority)**:
   - If Command Palette is open, all keyboard input routes to the palette search input. `Escape` dismisses.
2. **Global Shortcuts**:
   - `Ctrl+Shift+P` / `F1`: Toggles Command Palette.
   - `Ctrl+P`: Toggles Quick Open file finder.
   - `Ctrl+B`: Toggles Left Dock (File Tree).
   - `Ctrl+Alt+B`: Toggles Right Dock (Agent Panel).
   - `Ctrl+` ` `: Toggles Bottom Dock (Terminal).
   - `Ctrl+,`: Opens user `settings.json`.
3. **Focused Component**:
   - If focus is in Terminal: keys transmit to PTY stdin.
   - If focus is in File Tree: keys navigate items (`Up`, `Down`, `Enter`, `Delete`, `F2`).
   - If focus is in Agent Input: keys type into prompt textarea (`Enter` dispatches).
   - If focus is in Editor: keys type and navigate text buffer (`recode_buffer`).

### 1.3 Clean Shutdown & Teardown
* Upon window close request:
  * Checks all open `TabItem` instances for `is_dirty == true`.
  * If dirty buffers exist, displays non-modal prompt: *"Do you want to save changes to [File]? [Save] [Don't Save] [Cancel]"*.
  * On confirmation to exit:
    * Sends `textDocument/didClose` and `shutdown` to active language servers.
    * Sends termination signals to active terminal PTY child processes.
    * Persists window geometry and active workspace path to settings.
