# Observable Behavior Specification: Module 5 — Terminal & Command Palette

## 1. Integrated Terminal (Bottom Dock)

The integrated terminal provides an embedded pseudo-terminal (PTY) shell embedded inside the Bottom Dock panel.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TERMINAL 1: powershell.exe     [+ New] [Trash] [Collapse]                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PS C:\Users\Recode\Project> cargo check                                    │
│    Checking recode_core v0.1.0 (C:\Users\Recode\Project)                   │
│     Finished `dev` profile [unoptimized + debuginfo] in 0.84s               │
│ PS C:\Users\Recode\Project> █                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Structural Geometry & Font Metrics
* **Cell Grid**: Columns $\times$ Rows dynamically computed from available pixel dimensions:
  $$\text{Columns} = \left\lfloor \frac{\text{ViewportWidth} - 16\text{dp}}{\text{CharWidth}} \right\rfloor, \quad \text{Rows} = \left\lfloor \frac{\text{ViewportHeight} - 28\text{dp}}{\text{LineHeight}} \right\rfloor$$
* **Default Font**: Monospace font size `13dp`, line height multiplier `1.4` ($\approx 18.2\text{dp}$).
* **Padding**: `8dp` top, bottom, left, right padding around the terminal text grid.
* **Scrollback Buffer**: Retains a minimum of `10,000` lines of terminal output history.

### 1.2 User Input & State Transitions
* **Terminal Toggle (`Ctrl+` ` ` / `Cmd+J`)**:
  * Toggles bottom panel visibility. When opened, immediately focuses terminal input.
* **New Terminal Instance (`Ctrl+Shift+` ` ` / Click `+`)**:
  * Spawns an additional concurrent shell process in a new tab.
* **Copy / Paste**:
  * `Ctrl+Shift+C`: Copies active terminal selection to clipboard.
  * `Ctrl+Shift+V`: Pastes clipboard content directly into terminal stdin.
  * Right-click inside terminal pastes clipboard text if nothing is selected.
* **Process Interrupt (`Ctrl+C`)**:
  * If a running child process is active (e.g. `npm run dev`, `cargo watch`), sends standard interrupt signal (`SIGINT`) without terminating the shell session.
* **PTY Resize Propagation**:
  * Dragging the terminal resize border dynamically recalculates character columns and rows, transmitting window resize signals (`SIGWINCH` / console buffer info) to the PTY process.
* **Hyperlink Detection**:
  * URLs (`https://...`) and file paths with line numbers (e.g., `src/main.rs:42:10`) are automatically underlined on hover.
  * `Ctrl+Click` on a URL opens default browser; `Ctrl+Click` on a file path jumps to that file and coordinate in the editor.

---

## 2. Command Palette & Quick Open Overlay

The Command Palette is a high-speed modal overlay floating over the active editor canvas.

```
┌──────────────────────────────────────────────────────────────┐
│  > format doc                                            Esc │
├──────────────────────────────────────────────────────────────┤
│  ✓ Editor: Format Document                 Shift+Alt+F       │
│    File: Reformat with Prettier                              │
│    Preferences: Configure Formatter Settings                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Modal Geometry & Positioning
* **Width**: `600dp` fixed width (scales down on screens $< 640\text{dp}$).
* **Top Offset**: `64dp` from top of the window frame.
* **Search Input Height**: `42dp` with autofocus and `12dp` internal horizontal padding.
* **Results Row Height**: `34dp` per candidate.
* **Max Visible Results**: `10` items before vertical scrollbar engages (max height $\approx 382\text{dp}$).
* **Backdrop Scrim**: Translucent darkening banner covering background canvas ($25\%$ opacity).

### 2.2 Activation Modes & Prefixes
* **Command Mode (`Ctrl+Shift+P` / `Cmd+Shift+P` / `F1`)**:
  * Pre-populates search input with `>` prefix (or displays all system and user commands).
* **File Finder Mode (`Ctrl+P` / `Cmd+P`)**:
  * Empty prefix. Searches all files across the current workspace.
* **Go to Line Mode (`Ctrl+G` / `Cmd+G` or `:` prefix)**:
  * Typing `:45` immediately centers the active editor viewport on line 45 with live preview.
* **Symbol Search Mode (`Ctrl+T` / `Cmd+T` or `@` prefix)**:
  * Searches all functions, structs, and variables across the project.

### 2.3 Fuzzy Matching & Scoring Rules
* **Fuzzy Subsequence Matching**: Matches query characters in order across command titles and file paths.
* **Character Highlight**: Matching characters in labels render in `text.accent` with bold weight.
* **Ranking Invariants**:
  1. Exact prefix match scores highest.
  2. Word-boundary matches (camelCase / snake_case initials, e.g. `gb` matching `git branch`) score second.
  3. Recently executed commands receive a recency boost.

### 2.4 Keyboard Navigation & Execution
* `Down` / `Ctrl+N`: Moves highlight to next candidate.
* `Up` / `Ctrl+P`: Moves highlight to previous candidate.
* `Enter`: Executes the highlighted command or opens the selected file, closing the modal.
* `Escape`: Instantly dismisses the palette, restoring keyboard focus to the editor cursor.
