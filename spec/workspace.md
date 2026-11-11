# Observable Behavior Specification: Module 3 — File Tree & Workspace Model

## 1. Workspace Structure & Multi-Root Projects

The workspace model manages one or more project root directories ("worktrees") displayed within the Left Dock panel.

```
┌────────────────────────────────────────────────────────┐
│ PROJECT ROOT: my-application           [+F] [+D] [↻]  │
├────────────────────────────────────────────────────────┤
│ ⌄ src/                                                 │
│     ⌄ components/                                      │
│         Button.tsx                                     │
│         Modal.tsx                              M       │
│     › utils/                                           │
│       index.ts                                 U       │
│   .gitignore                                           │
│   Cargo.toml                                           │
│   README.md                                            │
└────────────────────────────────────────────────────────┘
```

### 1.1 Structural Geometry & Spacing Values
* **Row Height**: `24dp` per item.
* **Nesting Indentation**: `16dp` per tree depth level ($X = \text{depth} \times 16\text{dp}$).
* **Expand/Collapse Caret**: Width `12dp`, centered in an `16dp` hit area.
* **File/Folder Icon**: Width `16dp`, height `16dp`, with `6dp` right margin preceding the text label.
* **Text Label**: $13\text{dp}$ font size, vertically centered, truncated with ellipsis if exceeding available row width.
* **Git Status Badge**: `16dp` width, right-aligned with `8dp` padding from dock boundary.
* **Header Toolbar**: Height `28dp`, displaying root directory name in bold/medium weight and hover action buttons (`18x18dp` icons: New File, New Folder, Refresh, Collapse All).

---

## 2. User Input & State Transitions

### 2.1 Expanding, Collapsing & Selection
* **Single Click**:
  * Clicking an expand/collapse arrow toggles the folder between open (`⌄`) and closed (`›`).
  * Clicking on a file row opens the file in a **Preview Tab** (italic title in the tab bar). Opening another file replaces this preview tab unless modified or pinned.
* **Double Click**:
  * Double-clicking a folder row toggles its expansion state.
  * Double-clicking a file row opens the file in a **Permanent Tab** (standard title, never auto-replaced).
* **Alt + Click on Folder**:
  * Recursively expands or collapses all nested subdirectories under the clicked folder.
* **Keyboard Navigation (`Up`, `Down`, `Left`, `Right`)**:
  * `Down`: Moves active selection to the next visible row.
  * `Up`: Moves active selection to the previous visible row.
  * `Right`: If on a collapsed folder, expands it. If already expanded, moves selection to its first child item.
  * `Left`: If on an expanded folder, collapses it. If on a collapsed folder or a file, moves selection to the parent directory.
  * `Enter`: Opens the selected file in a permanent tab. If on a folder, toggles expansion.

### 2.2 File & Directory Mutations
* **Inline Creation (New File / New Folder)**:
  * Triggered via toolbar buttons, context menu, or shortcuts (`A` for file, `Shift+A` for folder when tree is focused).
  * An inline text input box spawns directly under the target directory at the appropriate indent depth.
  * `Enter`: Commits creation to disk, refreshes the tree, selects the new item, and immediately opens new files in the editor.
  * `Escape`: Cancels creation without touching the disk.
  * **Validation Invariants**:
    * Rejects names containing prohibited characters: `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|` (Windows) or names starting with `/` (Unix).
    * Highlights input box with `status.error` border if name already exists or is empty.
* **Inline Renaming (`F2`)**:
  * Selected row label transforms into an editable text input with current filename pre-selected (excluding extension).
  * `Enter` commits the rename on disk and updates all open tabs referencing the file.
  * `Escape` cancels without modification.
* **Deletion (`Delete` / `Backspace`)**:
  * Displays a non-modal confirmation modal: *"Are you sure you want to delete '[Name]'? This action moves the file to the OS Trash."*
  * On confirmation, moves target to trash and closes any active editor tabs associated with that file path.
* **Drag and Drop**:
  * Dragging an item onto a directory folder highlights the folder with a subtle accent box. Dropping moves the item into that folder.
  * Dragging into the editor area opens the file in a tab.

---

## 3. Git Status & Ignored Files Invariants

* **Ignored Files (`.gitignore`)**:
  * Any file or folder matched by `.gitignore` rules is rendered at $45\%$ opacity (`text.muted`).
  * Ignored items remain expandable and selectable, but visually subdued.
* **Status Badges**:
  * `Modified` (`M`): Amber/yellow label text and badge color.
  * `Untracked` / `Added` (`U` / `A`): Green label text and badge color.
  * `Deleted` (`D`): Red label text and badge color.
  * `Conflicted` (`!`): Bright red/orange badge color.
  * Parent directories of modified items display a small dot indicator if collapsed.

---

## 4. Sorting & Ordering Invariants

Items within any directory are sorted strictly according to:
1. **Directories First**: All subdirectories appear before any standalone files.
2. **Alphabetical Order**: Case-insensitive natural alphanumeric sorting (e.g., `item2` before `item10`).
3. **Hidden / Dotfiles**: Dotfiles (e.g., `.editorconfig`, `.gitignore`) sort alphabetically alongside standard files.

---

## 5. Live Filesystem Watching & Performance

* **External Changes**:
  * Live filesystem watcher observes directory tree.
  * Changes initiated outside the editor (e.g., `git checkout`, `npm install`, cargo builds) reflect in the tree within $100\text{ms}$.
* **Large Workspaces (> 100,000 files)**:
  * Tree items are loaded lazily on demand upon expanding folders.
  * Collapsed directories do not traverse or hold memory for deeper descendants until opened.
  * Virtualized rendering: Only rows currently visible in the Left Dock viewport are rendered into the visual tree.
