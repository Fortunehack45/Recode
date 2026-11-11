# Observable Behavior Specification: Module 1 — Text Buffer & Editing

## 1. Document Model & Coordinate Space

### 1.1 Text Addressing Coordinates
The editor operates on an observable two-dimensional coordinate grid:
* **Line Index**: Zero-based integer ($L \in [0, N-1]$), where $N$ is the total number of lines in the document. An empty document contains exactly 1 line ($L = 0$).
* **Column Index**: Zero-based integer ($C \in [0, M_L]$), representing the character offset within line $L$. $M_L$ is the length of line $L$ in UTF-8 characters.
* **Linear Character Offset**: Zero-based index ($O \in [0, \text{TotalChars}]$), counting all characters and newline delimiters sequentially from the start of the buffer.

### 1.2 Caret & Selection Structure
* Each active cursor is represented as a **Selection** consisting of:
  * `Anchor`: The fixed position where the selection began.
  * `Head`: The active position of the cursor that moves with input.
  * When `Anchor == Head`, the selection is a **Collapsed Caret** (blinking vertical bar).
  * When `Anchor != Head`, the characters between `min(Anchor, Head)` and `max(Anchor, Head)` are highlighted as an active selection.
* **Multi-Cursor Support**:
  * An arbitrary number of independent selections can exist concurrently.
  * Selections that overlap or touch collapse automatically into a single merged selection spanning `min(all anchors/heads)` to `max(all anchors/heads)`.

---

## 2. User Input & State Transitions

### 2.1 Character Insertion & Typing
* **Single Caret**: Typing any printable character replaces the current selection (if non-empty) with that character, advancing the caret by 1 column.
* **Multi-Caret**: Typing enters the character simultaneously at every active caret.
* **Bracket & Quote Auto-Closing**:
  * Typing `(`, `[`, `{`, `"`, `'`, or `` ` `` automatically inserts the matching closing delimiter immediately after the caret.
  * The caret remains positioned *between* the opening and closing delimiters.
  * If text is selected when typing an opening delimiter, the selected text is wrapped inside the delimiter pair, and the selection expands or maintains its content.
  * Typing a closing delimiter when the cursor is positioned directly before that exact closing character steps over it without inserting a duplicate.
* **Enter / Return**:
  * Splits the current line at the caret position.
  * If the caret is after an indentation level, the new line inherits the leading whitespace of the previous line (auto-indent).
  * If the caret is immediately between `{` and `}`, pressing Enter moves `}` to a new line and places the caret on an indented empty line between them.
* **Backspace & Delete**:
  * **Backspace**: Deletes the character immediately to the left of the caret. If a selection is active, deletes the selected text without moving the caret backwards. At column 0, merges the current line with the previous line.
  * **Delete**: Deletes the character immediately to the right of the caret. At the end of a line, merges the following line into the current line.
  * **Ctrl+Backspace**: Deletes from the caret back to the previous word boundary.
  * **Ctrl+Delete**: Deletes from the caret forward to the next word boundary.

### 2.2 Navigation & Cursor Traversal
* **Arrow Keys**:
  * `Left` / `Right`: Moves caret 1 character in that direction. Collapses any active selection to its left/right boundary.
  * `Up` / `Down`: Moves caret 1 visual line up/down, preserving the visual horizontal column (or snapping to the line end if the target line is shorter).
  * `Ctrl+Left` / `Ctrl+Right`: Jumps to the start of the previous/next word boundary.
  * `Home`: Jumps to the first non-whitespace character on the line. Pressing `Home` again jumps to column 0.
  * `End`: Jumps to the last character of the current line.
  * `Ctrl+Home`: Jumps to line 0, column 0 (document start).
  * `Ctrl+End`: Jumps to the final column of the final line (document end).
  * `PageUp` / `PageDown`: Scrolls the viewport by one full page height and moves the cursor accordingly.
* **Selection Expansion with Shift**:
  * Holding `Shift` in combination with any navigation command (`Shift+Left`, `Shift+Right`, `Shift+Up`, `Shift+Down`, `Shift+Ctrl+Left`, `Shift+Home`, etc.) keeps the `Anchor` stationary while extending the `Head` to the target position.

### 2.3 Mouse Interactions
* **Single Click**: Moves the primary caret to the nearest character boundary under the cursor and clears all secondary carets.
* **Click and Drag**: Sets the `Anchor` at the click origin and updates the `Head` dynamically as the mouse moves.
* **Double Click**: Selects the word under the cursor. Dragging after double-clicking expands selection word-by-word.
* **Triple Click**: Selects the entire line under the cursor, including its newline character. Dragging expands line-by-line.
* **Ctrl+Click (Multi-Cursor Placement)**: Adds a new independent caret at the clicked position without removing existing carets.
* **Alt+Drag (Column / Box Selection)**: Creates a rectangular selection across multiple lines, spawning a caret at each line within the column range.
* **Mouse Wheel**: Scrolls the viewport vertically; `Shift+Wheel` scrolls horizontally.

---

## 3. Commands & Default Keybindings

| Command Name | Windows / Linux Binding | macOS Binding | Observable Action |
| :--- | :--- | :--- | :--- |
| **Undo** | `Ctrl+Z` | `Cmd+Z` | Reverts the last atomic editing action or keystroke burst. Restores carets to prior positions. |
| **Redo** | `Ctrl+Y` / `Ctrl+Shift+Z` | `Cmd+Shift+Z` | Reapplies the most recently undone action. |
| **Cut** | `Ctrl+X` | `Cmd+X` | Copies selection to OS clipboard and deletes it. If collapsed, cuts the current entire line. |
| **Copy** | `Ctrl+C` | `Cmd+C` | Copies selection to OS clipboard. If collapsed, copies the current entire line. |
| **Paste** | `Ctrl+V` | `Cmd+V` | Inserts clipboard text at active carets. If multi-line clipboard matches caret count, pastes 1 line per caret. |
| **Select All** | `Ctrl+A` | `Cmd+A` | Creates a selection from line 0, column 0 to the document end. |
| **Duplicate Line Down** | `Shift+Alt+Down` | `Shift+Opt+Down` | Clones current line(s) directly below, maintaining cursor relative position. |
| **Move Line Up / Down** | `Alt+Up` / `Alt+Down` | `Opt+Up` / `Opt+Down` | Swaps the current line(s) with the line above or below. |
| **Delete Line** | `Ctrl+Shift+K` | `Cmd+Shift+K` | Deletes the entire line under the cursor without copying it to the clipboard. |
| **Toggle Line Comment** | `Ctrl+/` | `Cmd+/` | Toggles the language's comment delimiter at the start of current/selected line(s). |
| **Indent / Unindent** | `Tab` / `Shift+Tab` | `Tab` / `Shift+Tab` | Increases/decreases indentation of selected lines by one tab stop. |
| **Add Cursor Above/Below** | `Ctrl+Alt+Up` / `Down` | `Cmd+Opt+Up` / `Down` | Adds a new caret directly 1 line above or below at the same column. |

---

## 4. Layout Geometry & Spacing Values

Measurements are specified in density-independent pixels (dp):

```
┌──────┬──────────────────────────────────────────────────────────────────┐
│ Gutter│ Content Area                                                     │
│ 48dp  │                                                                  │
│      │                                                                  │
│  12  │    fn main() {                                                   │
│  13  │        let x = 42; █ <── Caret: 2dp width, line-height height    │
│  14  │    }                                                             │
│      │                                                                  │
└──────┴──────────────────────────────────────────────────────────────────┘
```

* **Gutter**:
  * **Width**: Dynamic, minimum `48dp`. Expands automatically when line count exceeds 3 digits (e.g., width = $(\text{digits} \times \text{character\_width}) + 24\text{dp}$).
  * **Padding**: `12dp` right padding separating line numbers from the editor content area.
  * **Line Number Alignment**: Right-aligned within the gutter column.
* **Content Viewport**:
  * **Default Font Size**: `14dp` / `10.5pt`.
  * **Default Line Height**: `1.5` multiplier ($\approx 21\text{dp}$ at $14\text{dp}$ font size).
  * **Caret Dimensions**: Width = `2dp`. Height = $100\%$ of active font line height.
  * **Tab Size**: Default visual equivalent of `4` spaces (configurable to `2`).
  * **Scroll Offscreen Margins (Scroll Off)**: Viewport maintains at least `3` lines of visible context above and below the active caret during arrow traversal.

---

## 5. Visual Theme Tokens

All colors are defined as abstract semantic tokens (resolved by the active theme):

* `editor.background`: Canvas fill behind all content and gutter.
* `editor.foreground`: Default unstyled text color.
* `editor.gutter.foreground`: Dimmed text color for inactive line numbers.
* `editor.gutter.activeForeground`: Brightened/accent color for the line number containing the primary cursor.
* `editor.currentLine.background`: Subtle full-width highlight banner behind the active line ($4\%$ to $8\%$ opacity).
* `editor.caret.color`: High-contrast cursor color (solid bar).
* `editor.selection.background`: Translucent selection color ($20\%$ to $30\%$ alpha) so underlying glyphs remain readable.
* `editor.whitespace.foreground`: Ultra-faint dot or arrow indicators for spaces and tabs.
* `editor.findMatch.background`: Highlight color indicating search query occurrences.

---

## 6. Animation Timings & Easing

* **Caret Blinking**:
  * Period: `1000ms` total cycle ($500\text{ms}$ fully visible, $500\text{ms}$ transparent).
  * Type: Square pulse or smooth step curve.
  * Reset on Input: Any keyboard or mouse interaction instantly forces the caret to $100\%$ opacity and restarts the timer.
* **Smooth Scrolling**:
  * Duration: `150ms` to `220ms` for mouse-wheel increments.
  * Curve: Cubic bezier ease-out (`cubic-bezier(0.25, 0.1, 0.25, 1.0)`).

---

## 7. Loading, Error, and Edge States

### 7.1 Loading & File Size Limits
* **Empty Document**:
  * Renders line number `1`, blank content area, caret at `0:0`.
* **Huge Files (> 50 MB)**:
  * Fast streaming load. Large files disable expensive tokenizers and soft-wrapping to preserve 60/120 FPS scrolling and typing response.
* **External Modification Conflict**:
  * If a file currently open in the editor is modified on disk by an external process:
    * If local buffer is unmodified: Auto-reloads content silently without losing viewport position.
    * If local buffer has unsaved changes: Displays a non-modal warning bar prompting user to "Overwrite on Save" or "Reload from Disk".

### 7.2 Unicode, Newlines & Encoding Edge Cases
* **Line Ending Normalization**:
  * Preserves original file line ending format (`\n` LF or `\r\n` CRLF).
  * Automatically detects and displays line ending in status indicator.
  * Pasting text with inconsistent line endings converts pasted endings to match document standard.
* **Trailing Newlines**:
  * Preserves or appends a single trailing newline upon saving if standard POSIX mode is enabled.
* **Multi-Byte Characters & Grapheme Clusters**:
  * Multi-byte UTF-8 characters (e.g. accented characters, Chinese characters, emojis, zero-width joiners) must be traversed as single grapheme units:
    * A single backspace deletes the full emoji cluster (e.g. 👨‍👩‍👧‍👦), never leaving half-broken unicode surrogate bytes.
    * Arrow keys jump across the entire grapheme cluster in one press.
* **Bi-Directional Text (LTR / RTL)**:
  * Visual rendering reflects logical character sequence with proper bidirectional shaping when Arabic or Hebrew characters are present.
