# Observable Behavior Specification: Module 2 — Theming & Layout Shell

## 1. Window Topology & Layout Geometry

The application shell provides a responsive docking layout divided into persistent top, bottom, and three interior columns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Window Title Bar & Navigation Controls (Height: 36dp)                       │
├──────────────┬──────────────────────────────────────────────┬───────────────┤
│ Left Dock    │ Tab Bar (Height: 36dp)                       │ Right Dock    │
│ (Width: 260dp│ ┌──────────────┬──────────────┐ ┌──────────┐ │ (Width: 320dp │
│  Default)    │ │ Active Tab   │ Inactive Tab │ │ + Split  │ │  Default)     │
│              │ ├──────────────┴──────────────┴─┴──────────┤ │               │
│ Project Tree │                                            │ Agent / AI    │
│              │ Editor Content Canvas                      │ Assistant     │
│ [Resizable   │                                            │ [Resizable    │
│  Min: 180dp] │                                            │  Min: 220dp]  │
│              ├────────────────────────────────────────────┤               │
│              │ Bottom Dock: Terminal / Output [H: 220dp]  │               │
├──────────────┴────────────────────────────────────────────┴───────────────┤
│ Status Bar (Height: 26dp)                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Structural Dimensions (Density-Independent Pixels - dp)
* **Title Bar**: Height = `36dp`. Spans $100\%$ window width.
* **Status Bar**: Height = `26dp`. Spans $100\%$ window width at bottom edge.
* **Tab Bar**: Height = `36dp`. Sits at the top of each editor pane.
* **Left Dock (Project Panel)**:
  * Default Width: `260dp`.
  * Minimum Allowed Width: `180dp`.
  * Maximum Allowed Width: $45\%$ of total window width.
* **Right Dock (Agent / Assistant Panel)**:
  * Default Width: `320dp`.
  * Minimum Allowed Width: `220dp`.
  * Maximum Allowed Width: $50\%$ of total window width.
* **Bottom Dock (Terminal / Console)**:
  * Default Height: `220dp`.
  * Minimum Allowed Height: `100dp`.
  * Maximum Allowed Height: $70\%$ of total window height.
* **Dividers & Resize Hitboxes**:
  * Visual Border Width: `1dp`.
  * Interactive Resize Hitbox: `5dp` centered across the `1dp` border line, changing mouse cursor to horizontal/vertical resize arrows (`col-resize` / `row-resize`).

---

## 2. User Input & State Transitions

### 2.1 Panel Docking & Toggling
* **Left Dock Toggle (`Ctrl+B` / `Cmd+B`)**:
  * If visible, collapses to width 0 with a `150ms` cubic ease-out animation. Center editor canvas expands to occupy freed space.
  * If hidden, animates open to its previous remembered width.
* **Right Dock Toggle (`Ctrl+Alt+B` / `Cmd+Opt+B`)**:
  * Toggles the visibility of the right agent pane.
* **Bottom Dock Toggle (`Ctrl+` ` ` / `Cmd+J`)**:
  * Toggles the bottom terminal panel. When toggled open, terminal input automatically acquires focus.
* **Panel Resizing**:
  * Hovering within `2.5dp` of any dock border turns cursor to resize pointer.
  * Dragging updates dock dimensions in real time at display refresh rate ($60\text{Hz}$ / $120\text{Hz}$).
  * Double-clicking a resize border snaps the dock to its default width or fits content.

### 2.2 Tab Strip & Pane Management
* **Tab Activation (Single Click)**:
  * Switches the active document in the current pane instantly ($0\text{ms}$).
  * Updates the window title and status bar metadata to match the activated tab.
* **Tab Close (`Ctrl+W` / Click `×`)**:
  * Closes the active tab. If unsaved edits exist, triggers an unsaved changes confirmation prompt ("Save", "Don't Save", "Cancel").
  * Focus shifts to the nearest neighboring tab (prefers right neighbor; if closed tab was rightmost, shifts to left neighbor).
  * Closing the last tab leaves an empty pane with centered shortcut watermark hints.
* **Pane Splitting (`Ctrl+\` / `Cmd+\` for Vertical, `Ctrl+K Ctrl+\` for Horizontal)**:
  * Bisects the active editor canvas into two equal-width or equal-height panes.
  * Focus moves to the new split pane with the current document cloned or empty.
* **Tab Dragging & Detachment**:
  * Dragging a tab horizontally within the strip reorders the tabs.
  * Dragging a tab to the right/left/top/bottom screen edge displays a translucent drop target zone ($20\%$ opacity accent tint), dropping creates a new split pane.

### 2.3 Status Bar Indicators
The status bar displays live metadata formatted left-to-right:
* **Left Cluster**:
  * Git Branch icon and name (e.g., `⎇ main`). Clicking opens branch switcher.
  * Diagnostics indicator: Error and warning counts (`⨂ 0  ⚠ 2`). Clicking focuses Problems panel.
* **Right Cluster**:
  * Cursor Coordinates: `Ln 14, Col 28` (or `14:28`). Clicking opens Go to Line prompt.
  * Indentation Mode: `Spaces: 4` (or `Tab Size: 4`). Clicking opens indentation picker.
  * Character Encoding: `UTF-8`.
  * Line Ending: `LF` or `CRLF`. Clicking toggles line ending format.
  * Language Grammar: e.g., `Rust`, `TypeScript`, `Markdown`. Clicking opens grammar selector.

---

## 3. Theme System & Design Token Architecture

All UI components render exclusively using semantic design tokens. Themes are defined as JSON declarations mapping tokens to hex/RGBA color values.

### 3.1 Core Semantic Token Hierarchy
* **Surface Tokens (Backgrounds)**:
  * `surface.canvas`: Base window canvas fill behind all elements.
  * `surface.panel`: Primary fill for side docks, bottom terminal, and tab strip header.
  * `surface.header`: Slightly darker/lighter fill for title bar and toolbars.
  * `surface.active`: Highlight fill for active tabs, selected list items, and dropdown selections.
  * `surface.hover`: Translucent hover tint ($5\%$ to $10\%$ overlay).
* **Border & Separator Tokens**:
  * `border.divider`: `1dp` border separating adjacent docks and panes.
  * `border.subtle`: Faint border around search inputs and buttons.
  * `border.focus`: High-contrast accent ring around active inputs.
* **Typography Tokens**:
  * `text.primary`: High-contrast foreground for active code and primary titles.
  * `text.muted`: Secondary text for inactive tabs, gutter numbers, and status labels.
  * `text.accent`: Brand accent color used for cursor, active tab indicators, and links.
* **Status Tokens**:
  * `status.error`: High-visibility red for compiler errors and git deletion badges.
  * `status.warning`: Amber/yellow for linter warnings.
  * `status.success`: Green for git additions and test passes.
  * `status.info`: Cyan/blue for informative notifications.

### 3.2 Dynamic Hot-Reload Behavior
* Modifying the active theme in settings re-renders all open windows within 1 frame ($< 16\text{ms}$).
* Zero application restart, zero loss of cursor position, scroll position, or terminal process state during theme reload.

---

## 4. Animation Curves & Easing

* **Dock Slide Animation**:
  * Duration: `150ms`.
  * Curve: `cubic-bezier(0.16, 1.0, 0.3, 1.0)` (exponential ease-out: starts fast, lands smoothly).
* **Hover State Transitions**:
  * Duration: `80ms`.
  * Curve: Linear opacity interpolation.
* **Tab Switch**:
  * `0ms` (Instantaneous) to guarantee zero perception of input lag during keyboard cycling (`Ctrl+Tab`).

---

## 5. Error & Fallback States

* **Malformed Theme JSON**:
  * If a custom or loaded theme file contains syntax errors or missing mandatory tokens:
    * The editor surfaces a non-blocking toast warning: *"Failed to parse theme: [Error]. Falling back to default dark theme."*
    * The UI falls back to a built-in immutable `Recode Dark` theme without crashing or showing blank surfaces.
* **Display Scaling (DPI) & Multi-Monitor Changes**:
  * Moving the window across displays with different scaling factors ($100\%$, $125\%$, $150\%$, $200\%$ DPI) recalibrates physical pixel rasterization immediately without blurriness.
* **Minimum Window Dimensions**:
  * Window refuses to resize below `640dp` width and `480dp` height. Docks automatically compress according to their minimum width constraints.
