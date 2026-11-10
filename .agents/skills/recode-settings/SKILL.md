---
name: recode-settings
description: Comprehensive Recode IDE settings configuration and autonomous in-place adjustment. Allows the AI to directly inspect and modify user and project settings in settings.json without opening the settings tab, instantly hot-reloading configurations in-place.
---

# Recode IDE Settings Architecture & Autonomous In-Place Adjustment

This skill enables the AI to inspect, understand, and directly modify Recode IDE settings in-place without requiring the user to leave their current editor screen or manually open the settings tab.

---

## 1. Autonomous In-Place Settings Adjustment Protocol

When a user requests a configuration change (e.g., *"change my theme to One Dark"*, *"make my font size 16"*, *"dock terminal to the right"*, *"turn on vim mode"*, *"disable auto update"*):

### Execution Rules:
1. **Never force the user to open settings tabs**: Do not tell the user to navigate to `recode://settings/...` unless they specifically ask how to find the setting manually.
2. **Direct In-Place Modification**: Directly read the active `settings.json` file, apply the updated JSON property cleanly, and write the updated contents back.
3. **Instant Live Hot-Reload**: Recode monitors `settings.json` with native file system watchers. The moment the file is written, the IDE hot-reloads the setting instantly in the background without reloading the window or switching tabs.
4. **Preserve User Structure**: Parse the existing JSON carefully. Do not blow away comments or adjacent configuration keys. If the file does not exist yet, create it with valid JSON.

---

## 2. Configuration File Locations

### Global User Settings:
- **Windows**: `$env:APPDATA\Recode\settings.json` (e.g., `C:\Users\<User>\AppData\Roaming\Recode\settings.json`)
- **macOS**: `~/Library/Application Support/Recode/settings.json` or `~/.config/recode/settings.json`
- **Linux & BSD**: `~/.config/recode/settings.json` (or `$XDG_CONFIG_HOME/recode/settings.json`)

### Project / Local Workspace Settings:
- **Project Root**: `.recode/settings.json` in the workspace root

---

## 3. Comprehensive Settings Key & Value Catalog

### Core Appearance & Themes
- `theme`: String or object. Examples: `"One Dark"`, `"Aura Dark"`, `"Nord"`, `"Rosé Pine"`, `"Solarized Dark"`, `"GitHub Dark"`.
  ```json
  "theme": {
    "mode": "system",
    "light": "One Light",
    "dark": "One Dark"
  }
  ```
- `icon_theme`: String. `"Recode (Default)"`, `"VS Code (Default)"`, `"None"`.
- `ui_font_family`: String font name. (e.g., `"Inter"`, `"system-ui"`).
- `ui_font_size`: Number in pt (default `16.0`).
- `buffer_font_family`: String font name. (e.g., `"JetBrains Mono"`, `"Fira Code"`).
- `buffer_font_size`: Number in pt (default `15.0`).
- `buffer_line_height`: Object or number (`{"custom": 1.5}` or `"standard"`).

### Editor Behavior
- `vim_mode`: Boolean (`true` | `false`).
- `relative_line_numbers`: Boolean (`true` | `false`).
- `cursor_blink`: Boolean (`true` | `false`).
- `tab_size`: Integer (e.g., `2` or `4`).
- `hard_tabs`: Boolean (`true` | `false`).
- `format_on_save`: Object (`"off"` | `"on"` | `{"custom": ...}`).
  ```json
  "format_on_save": "on"
  ```
- `auto_signature_help`: Boolean (`true` | `false`).
- `show_whitespaces`: `"all"` | `"boundary"` | `"selection"` | `"none"`.
- `wrap_guides`: Array of column numbers, e.g. `[80, 120]`.
- `soft_wrap`: `"none"` | `"prefer_line"` | `"editor_width"` | `"bounded"`.

### Terminal Settings
- `terminal.dock`: Position of the terminal panel (`"bottom"` | `"right"` | `"left"`).
- `terminal.font_family`: String font family name.
- `terminal.font_size`: Number in pt (e.g., `14.0`).
- `terminal.line_height`: Number or `"comfortable"`.
- `terminal.shell`: Object or string specifying custom shell (e.g., `"system"`, `{"program": "powershell.exe"}`).
- `terminal.copy_on_select`: Boolean (`true` | `false`).
- `terminal.blinking`: `"terminal_controlled"` | `"always"` | `"never"`.

### AI & Agent Settings
- `agent.skills`: Object configuring active skills.
- `agent.tool_permissions`: Object defining auto-approval and confirmation regex rules:
  ```json
  "agent": {
    "tool_permissions": {
      "default": "allow",
      "tools": {
        "terminal": {
          "default": "confirm",
          "always_allow": [
            { "pattern": "^cargo\\s+(build|test|check)" }
          ]
        }
      }
    }
  }
  ```
- `agent.dock`: Position (`"right"` | `"left"` | `"bottom"`).
- `agent.default_model`: Object specifying default LLM provider and model ID:
  ```json
  "agent": {
    "default_model": {
      "provider": "anthropic",
      "model": "claude-3-7-sonnet-latest"
    }
  }
  ```
- `edit_predictions`: Object configuring inline AI completion:
  ```json
  "edit_predictions": {
    "provider": "copilot"
  }
  ```

### File & Git Behaviors
- `autosave`: `"off"` | `"after_delay"` | `"on_focus_change"` | `"on_window_change"`.
- `autosave_delay_ms`: Number in milliseconds (e.g., `1000`).
- `git.git_gutter`: `"tracked_files"` | `"all"` | `"none"`.
- `git.inline_blame.enabled`: Boolean (`true` | `false`).
- `git.inline_blame.delay_ms`: Number in ms.
- `project_panel.dock`: `"left"` | `"right"`.
- `project_panel.auto_reveal_entries`: Boolean (`true` | `false`).

---

## 4. In-Place Update Step-by-Step Procedure

When asked to update a setting:
1. Locate the configuration file:
   - Check if the change is project-specific; if so, target `.recode/settings.json`.
   - Otherwise, target global user `settings.json` (resolving platform path as specified in Section 2).
2. Read the file with `read_file`.
3. If the file contains valid JSON (or JSONC), merge the new key-value pair into the existing object hierarchy.
4. Save the file using `write_file` (with `Overwrite: true`) or `edit_file`.
5. Inform the user in one sentence that the setting has been applied and is active immediately (e.g. *"I've updated your theme to 'One Dark' in settings.json—it has taken effect immediately."*).
