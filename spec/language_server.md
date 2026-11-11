# Observable Behavior Specification: Module 4 — LSP Client & Diagnostics

## 1. Language Server Protocol (LSP) Architecture & Lifecycle

The LSP client coordinates background language servers over JSON-RPC (standard standard input/output streams `stdin`/`stdout`).

### 1.1 Server Lifecycle
* **Discovery & Activation**:
  * Activated when a file with a matching file extension is opened (e.g., `.rs` triggers `rust-analyzer`, `.ts`/`.js` triggers `typescript-language-server`, `.py` triggers `pyright`).
  * If the language binary is not found on PATH or configured path:
    * The editor operates gracefully without language server intelligence; typing and rendering are never blocked.
    * Status bar displays: `[Language] (No LSP)` with an option to install or configure.
* **Initialization Handshake**:
  1. Client sends `initialize` request with client capabilities (completions, hover, diagnostics, code actions, formatting, rename).
  2. Server returns `InitializeResult` detailing supported capabilities.
  3. Client sends `initialized` notification.
* **Status Bar Activity Indicator**:
  * Server indexing/checking displays a spinner and message in the status bar (e.g., `⟳ Indexing crates (12/48)`).
  * Server idle displays: `✓ [Server Name] Ready`.
* **Crash Recovery**:
  * If a server process exits unexpectedly, the status bar alerts: `⚠ [Server Name] stopped unexpectedly. [Restart]`.
  * Automatic restart occurs up to 3 times with exponential backoff ($1\text{s}, 2\text{s}, 4\text{s}$) before requiring manual user restart.

---

## 2. Document Synchronization Protocol

* **Open (`textDocument/didOpen`)**:
  * Dispatched immediately when a buffer tab opens.
  * Payload: URI, language ID, document version `1`, and initial buffer text.
* **Incremental Changes (`textDocument/didChange`)**:
  * Dispatched on editing transactions.
  * Debounced by `50ms` during fast typing bursts to prevent overwhelming language servers.
  * Transmits incremental character ranges (`Range`, `rangeLength`, `text`) alongside monotonically increasing document version integer.
* **Save (`textDocument/didSave`)**:
  * Dispatched upon saving file to disk. Triggers background linter/compiler checks (e.g. `cargo check`).
* **Close (`textDocument/didClose`)**:
  * Dispatched when the file tab is closed and not opened in any remaining split pane.

---

## 3. Diagnostics & Visual Annotations

Diagnostics published by the server (`textDocument/publishDiagnostics`) render across three distinct visual channels:

```
┌────┬──────────────────────────────────────────────────────────────────┐
│Gutt│ Content Area                                                     │
├────┼──────────────────────────────────────────────────────────────────┤
│ 12 │    let unused_val = 42;                                          │
│    │        ~~~~~~~~~~ <── Amber wavy underline (Warning: unused)     │
│ 13 │    let x: u32 = "invalid";                                       │
│ ●  │                 ^^^^^^^^^ <── Red wavy underline (Error: type)    │
│    │                                                                  │
└────┴──────────────────────────────────────────────────────────────────┘
```

### 3.1 Severity Levels & Visual Tokens
* **Error (Severity 1)**:
  * Visual: Solid or wavy underline in `status.error` (Red).
  * Gutter: Solid `8dp` circular marker in `status.error`.
  * Status Bar: Increments global error counter (`⨂ N`).
* **Warning (Severity 2)**:
  * Visual: Wavy underline in `status.warning` (Amber/Yellow).
  * Gutter: Solid `8dp` circular marker in `status.warning`.
  * Status Bar: Increments global warning counter (`⚠ N`).
* **Information (Severity 3)**:
  * Visual: Dotted underline in `status.info` (Blue/Cyan).
* **Hint (Severity 4)**:
  * Visual: Faint underline or dimmed text opacity ($60\%$).

### 3.2 Hover Diagnostic Tooltip
* Hovering over an underlined diagnostic for $> 300\text{ms}$ opens a non-modal tooltip:
  * Maximum Width: `480dp`.
  * Contains: Error description, source name (e.g. `rustc`, `eslint`), and clickable rule/code link.
  * Action button: *"Quick Fix... (`Ctrl+.`)"* if associated code actions are available.

---

## 4. Interactive Language Features & Keybindings

| Command | Shortcut (Win/Linux) | Shortcut (macOS) | LSP Method | Observable Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Go to Definition** | `F12` / `Ctrl+Click` | `F12` / `Cmd+Click` | `textDocument/definition` | Jumps cursor directly to definition location. If in another file, opens tab. |
| **Hover Info** | `Ctrl+K Ctrl+I` | `Cmd+K Cmd+I` | `textDocument/hover` | Opens markdown tooltip above cursor with type signature and documentation. |
| **Code Completion** | `Ctrl+Space` (or auto) | `Ctrl+Space` (or auto) | `textDocument/completion` | Opens floating completion list next to cursor. |
| **Rename Symbol** | `F2` | `F2` | `textDocument/rename` | Prepares inline rename box; commits changes across all workspace references. |
| **Format Document** | `Shift+Alt+F` | `Shift+Opt+F` | `textDocument/formatting` | Replaces whitespace/indentation according to formatter rules without jumping caret. |
| **Code Action** | `Ctrl+.` | `Cmd+.` | `textDocument/codeAction` | Opens quick-fix menu at caret with available automated refactorings. |
| **Find References** | `Shift+Alt+F12` | `Shift+Opt+F12` | `textDocument/references` | Opens references panel listing all call/read sites grouped by file. |

### 4.1 Autocomplete Completion Popup Geometry
* **Position**: Placed immediately below active caret (`y = caret_bottom + 4dp`, `x = caret_x`). If near bottom screen edge, flips above caret.
* **Width**: `320dp` (resizable up to `450dp`).
* **Max Height**: `220dp` (shows up to 8 items before scrolling).
* **Row Height**: `24dp` per completion candidate.
* **Item Display**:
  * Kind Icon (`16dp`): Keyword, Function, Variable, Struct, Interface, Module.
  * Completion Label: Bold matching characters for user's typed prefix.
  * Detail / Return Type: Dimmed right-aligned string.
* **Documentation Sub-Panel**: Secondary panel (`280dp` wide) attaches to the right of the completion menu when an item is highlighted.

---

## 5. Performance, Debounce & Asynchronous Invariants

* **Typing Latency Invariant**:
  * Under no circumstances may an LSP request block the UI thread or cause dropped keystrokes.
  * All JSON-RPC communications occur on asynchronous background worker tasks.
* **Outdated Request Cancellation**:
  * If a user types while a completion or hover request is pending, the previous pending request is immediately cancelled via `$/cancelRequest` to free server resources.
* **Massive Diagnostics Invariant**:
  * Servers reporting $> 5,000$ diagnostics have diagnostics capped and sorted by severity to preserve $60\text{FPS}$ rendering.
