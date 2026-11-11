# Observable Behavior Specification: Module 6 — Agent Panel, SDK & MCP Layer

## 1. Agent Panel Topology & Geometry

The Agent Panel is embedded in the Right Dock, providing a conversation stream, tool execution monitor, and prompt dispatch capsule.

```
┌────────────────────────────────────────────────────────┐
│ 🤖 AGENT: Claude Fable 5.2 (Local)   [+ New] [⚙ Settings]│
├────────────────────────────────────────────────────────┤
│ 👤 USER                                                │
│    Please refactor the error handling in main.rs       │
│                                                        │
│ 🤖 CLAUDE FABLE 5.2                                    │
│    ⌄ Thinking (0.8s)                                   │
│    ┌──────────────────────────────────────────────────┐│
│    │ 🛠 Tool: read_file ("src/main.rs")             ✓ ││
│    └──────────────────────────────────────────────────┘│
│    Here is the improved error handling using Result... │
│    ```rust                                            │
│    fn run() -> Result<(), Box<dyn Error>> { ... }     │
│    ```                                                 │
│    [Apply Diff] [Copy Code]                            │
├────────────────────────────────────────────────────────┤
│ Context: 1.4k / 16k tokens                      [100%] │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Ask a question, type / for skills, @ for files...  │ │
│ └────────────────────────────────────────────────────┘ │
│                                         [↑ Send Prompt]│
└────────────────────────────────────────────────────────┘
```

### 1.1 Structural Geometry & Spacing
* **Panel Width**: Default `320dp`, minimum `220dp`, maximum $50\%$ of window width.
* **Header Height**: `38dp`, containing model selector dropdown, thread switcher, and clear thread button.
* **Message Padding**: `12dp` vertical and horizontal padding around each chat bubble.
* **Input Box Container**:
  * Pinned to panel bottom, auto-growing from `48dp` (single line) up to `180dp` (multiline).
  * Textarea Font: `13dp`, line height `1.4`.
* **Token Gauge**: `20dp` height bar displaying current context consumption vs model maximum (e.g., `1.4k / 16k tokens`).
* **Tool Invocation Card**: Height `32dp` collapsed, expanding to show output logs on click. Border `1dp` with `status.info` accent.

---

## 2. User Input & State Transitions

### 2.1 Prompt Dispatch & Keystroke Shortcuts
* **Enter**: Submits the prompt to the active language model.
* **Shift+Enter**: Inserts a newline without dispatching.
* **Slash Command Trigger (`/`)**:
  * Typing `/` at the start of a prompt opens the floating Skills menu listing all available skills (`planning`, `rust`, `python`, `recode-settings`).
  * Arrow keys navigate; `Enter` or `Tab` autocompletes the skill invocation.
* **File Mention Trigger (`@`)**:
  * Typing `@` anywhere in the input opens a fuzzy file selector.
  * Selecting a file embeds a token pill referencing the file, attaching its contents to the prompt context.

### 2.2 Streaming Generation & Reasoning Mode
* **Latency**: First response token must appear within $< 500\text{ms}$ on local models and $< 1000\text{ms}$ on cloud providers.
* **Thinking Accordion**:
  * If the model emits reasoning tokens (e.g. thinking tags or reasoning models), they render inside a collapsible `Thinking...` banner with an active elapsed timer.
  * When synthesis begins, the accordion automatically collapses into a subtle bar.
* **Markdown Rendering**:
  * Headings, bold, inline code, and lists render formatted in real time as tokens arrive.
  * Fenced code blocks display syntax highlighting with an instant **"Apply Diff"** button that parses the code and updates the active editor file.

---

## 3. Tool Execution & Model Context Protocol (MCP)

### 3.1 Tool Invocation Lifecycle
* When the agent decides to invoke an external tool:
  1. Spawns an inline **Tool Card** displaying: Tool Name, Parameters, and a rotating spinner (`Running ⟳`).
  2. If the tool is flagged as destructive (e.g., running shell command or overwriting file), the card displays an **Approval Prompt** ("Allow" or "Deny").
  3. Upon tool completion, the card turns green (`✓ Completed`) with an expandable log of stdout / results.
  4. If the tool fails, turns amber/red (`⚠ Failed`) and feeds the error back to the model for self-correction.

### 3.2 Standard Core Tool Suite
* `read_file(path)`: Reads contents of a file in the workspace.
* `write_file(path, content)`: Creates or replaces file content.
* `edit_file(path, target, replacement)`: Surgically modifies matching code block.
* `list_directory(path)`: Retrieves directory entries.
* `run_command(command)`: Executes shell command in workspace directory.

### 3.3 MCP Server Bridge
* Supports external Model Context Protocol (MCP) servers via stdio or HTTP SSE.
* Discovers MCP tools dynamically at startup and registers them into the agent tool registry.

---

## 4. Local & Cloud Model Provider Architecture

* **Local Offline Provider (Ollama / Localhost)**:
  * Server endpoint: `http://localhost:11434` or configured URL.
  * Zero API key requirement (offline operation).
  * Model discovery: auto-detects installed models via `/api/tags`.
* **Cloud Providers**:
  * OpenRouter, OpenAI, Anthropic, Gemini via Bring-Your-Own-Key in settings.
* **Connection Error & Network Down States**:
  * If local server is not running: displays a banner: *"Cannot connect to Ollama at http://localhost:11434. Ensure Ollama is running."* with a **"Retry"** button.
  * If cloud API key is invalid: displays non-modal error with direct link to settings.
