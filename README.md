# Recode

<p align="center">
  <img src="crates/zed/resources/app-icon@2x.png" width="128" height="128" alt="Recode Logo" />
</p>

<p align="center">
  <strong>The Autonomous AI Code Editor. Built for Speed, Multi-Model Precision, and Native GPU Performance.</strong>
</p>

<p align="center">
  <a href="https://github.com/Fortunehack45/Recode/releases"><img src="https://img.shields.io/github/v/release/Fortunehack45/Recode?style=flat-square&color=blue" alt="Latest Release" /></a>
  <a href="LICENSE-GPL"><img src="https://img.shields.io/badge/license-GPL--3.0-green?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Platforms" />
  <img src="https://img.shields.io/badge/built%20with-Rust%20%2B%20GPUI-orange?style=flat-square" alt="Rust GPUI" />
  <img src="https://img.shields.io/badge/AI-Claude%20%7C%20GPT--4o%20%7C%20Gemini%20%7C%20DeepSeek%20%7C%20Ollama-purple?style=flat-square" alt="AI Models" />
</p>

---

## Overview

**Recode** is an open-source, native, GPU-accelerated code editor engineered in pure Rust. It combines instantaneous cold boot speeds (<50ms) and silky 120 FPS rendering with a deeply integrated autonomous AI coding agent, multi-file diff engine, full Model Context Protocol (MCP) ecosystem, and Bring Your Own Key (BYOK) privacy.

<p align="center">
  <img src="assets/images/recode-editor-agent.jpg" alt="Recode Autonomous AI Editor and Workspace" width="100%" />
  <br />
  <em>Recode in action: Autonomous AI Agent orchestrating multi-file project edits, executing terminal tool calls, and inspecting Tailwind CSS in a GPU-accelerated workspace.</em>
</p>

---

## ✨ Key Features

### 🤖 Autonomous AI Agent & Bring Your Own Key (BYOK)
- **Multi-Model Orchestration**: Connect seamlessly to Anthropic Claude (3.5 Sonnet, Opus), OpenAI (GPT-4o, o1, o3-mini), Google Gemini (2.5 Pro, Flash Lite), DeepSeek (V3, R1), or local models via Ollama and LM Studio.
- **True BYOK Freedom**: Input your own API keys directly. Your queries and code stay between your machine and your chosen AI provider with zero middleman markup, tracking, or rate-limiting.
- **Autonomous File & Terminal Operations**: The Recode Agent can explore project file trees, execute terminal commands (`node`, `npm`, `cargo`, `git`), create and edit multiple files concurrently, and present clean atomic diffs for 1-click review (`Keep All` / `Reject All`).
- **Flexible Modes**: Switch between **Write** (autonomous multi-file editing) and **Chat** (conversational codebase exploration) on the fly.

### ⚡ Blazing Native Performance (Zero Electron Overhead)
- **Engineered in Rust with GPUI**: Every pixel is rasterized directly on your GPU with Metal, DirectX, and Vulkan backends.
- **Sub-50ms Launch**: Opens immediately without splash screens or background warmup delays.
- **Minimal Resource Footprint**: Consumes only ~45–50MB of RAM at idle compared to 500MB–1GB+ in Chromium-based editors.

### 🧩 Extension Marketplace & Model Context Protocol (MCP)
- **Extensible Ecosystem**: Access 100+ community extensions directly from the in-app Marketplace, including language servers (Rust, TypeScript, Python, Go, PHP, Java, C/C++), themes, and icon packs.
- **First-Class MCP Integration**: Connect external tools, databases, and services to your AI agent using the standard Model Context Protocol (MCP) — Code Runner, MySQL, PostgreSQL, SQLite, Fetch, GitHub, and custom MCP servers.

### 🎨 Clean, Focused Workspace & Typography
<p align="center">
  <img src="assets/images/recode-welcome.png" alt="Recode Welcome Screen" width="90%" />
  <br />
  <em>Recode Welcome Launcher: Fast access to recent projects, command palette, and 1-click Git repository cloning.</em>
</p>

- **Custom-Tailored Typography**: Features custom-engineered default typography (**Recode Mono** and **Recode Sans**) alongside complete support for all system and Nerd Fonts.
- **Integrated Git Workflow**: Built-in visual branch indicators, file status diffs, commit timelines, and instant Git repository cloning.
- **Real-Time Multiplayer Collaboration**: Pair program with colleagues over CRDT-backed real-time synchronized buffers with voice and screen sharing.

---

## 🚀 Installation & Downloads

Official pre-built binary packages are published for every release:

| Platform | Package | Description |
| :--- | :--- | :--- |
| **Windows x64** | [**RecodeSetup-x64.exe**](https://github.com/Fortunehack45/Recode/releases/latest/download/RecodeSetup-x64.exe) | **Recommended.** 1-click installer with desktop & Start menu shortcuts, Explorer context menu ("Open with Recode"), and in-app auto-update. |
| **Windows x64** | `Recode-windows-x64-portable.zip` | Standalone portable archive. Zero installation required. |
| **macOS Apple Silicon** | `Recode-macos-arm64.zip` | Native universal binary for Apple Silicon (M1/M2/M3/M4). |
| **Linux x64** | `Recode-linux-x64.tar.gz` | Standalone tarball for modern Linux distributions. |

---

## 💻 Recode Terminal & Recode SDK

In addition to the GPU-accelerated desktop editor, Recode includes **Recode Terminal** (`@recode/cli`) and the **Recode SDK** (`@recode/sdk`), inspired by modern agentic architectures.

```
  ____                     _      
 |  _ \ ___  ___ ___   __| | ___ 
 | |_) / _ \/ __/ _ \ / _` |/ _ \
 |  _ <  __/ (_| (_) | (_| |  __/
 |_| \_\___|\___\___/ \__,_|\___|  v1.30.0
 Autonomous AI Software Engineering Terminal
```

### 1. Recode Terminal CLI (`@recode/cli`)

Run an autonomous coding agent directly inside your terminal with real-time streaming, interactive slash commands, and file diffing.

```bash
# Run immediately without installation
npx @recode/cli

# Or install globally with pnpm/npm
pnpm add -g @recode/cli
# or: npm install -g @recode/cli

# Launch interactive terminal assistant
recode

# Headless command execution (for scripts and CI/CD)
recode run "Inspect auth module, add unit tests, and run test suite"

# Check authentication and model providers
recode auth status

# Authenticate with GitHub (Device Flow - zero passwords, zero email)
recode auth login

# List available models
recode models
```

#### Pure Developer Authentication (Zero Email)
Recode Terminal strictly avoids Gmail, passwords, or magic links. It uses:
- **GitHub Device Code Flow**: Instant one-click browser approval (`recode auth login`)
- **GitHub Personal Access Tokens (PAT)**: For headless server/container environments
- **BYOK Provider API Keys**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, or local Ollama.

---

### 2. Recode SDK (`@recode/sdk`)

Programmatically orchestrate Recode's autonomous coding agent in your TypeScript/JavaScript projects, bots, or CI automations:

```bash
pnpm add @recode/sdk
```

```typescript
import { Recode, RecodeAuth } from "@recode/sdk";

// Initialize Recode client
const recode = new Recode({
  provider: "anthropic",
  model: "claude-3-7-sonnet",
  workspaceDir: process.cwd(),
});

// Create an interactive session
const session = recode.createSession();

// Stream autonomous reasoning, file operations, and token chunks
for await (const event of session.prompt("Refactor database schema to support vector embeddings")) {
  if (event.type === "token") {
    process.stdout.write(event.content);
  } else if (event.type === "tool_start") {
    console.log(`\n[Tool Executing] ${event.toolCall.name}`);
  } else if (event.type === "tool_end") {
    console.log(`[Tool Complete] Success: ${event.toolResult.success}`);
  }
}

// Or execute a prompt headlessly to completion:
const result = await recode.run("Run linting and fix format errors");
console.log(result);
```

---

## ⚙️ Configuration & Customization

Recode stores user settings in standard JSON format located at `~/.config/recode/settings.json` (or `%APPDATA%\Recode\settings.json` on Windows).

### Example Configuration: Bring Your Own API Key & MCP

```json
{
  "theme": "Recode Dark",
  "buffer_font_family": "Recode Mono",
  "buffer_font_size": 15.0,
  "ui_font_family": "Recode Sans",
  "ui_font_size": 16.0,
  "language_models": {
    "google": {
      "api_key": "YOUR_GEMINI_API_KEY"
    },
    "anthropic": {
      "api_key": "YOUR_ANTHROPIC_API_KEY"
    },
    "openai": {
      "api_key": "YOUR_OPENAI_API_KEY"
    },
    "ollama": {
      "api_url": "http://localhost:11434"
    }
  },
  "context_servers": {
    "code-runner": {
      "command": "mcp-server-code-runner"
    }
  }
}
```

---

## 🛠️ Building from Source

### Prerequisites
- [Rust](https://rustup.rs/) (stable channel, 1.85+)
- Git
- Platform Build Tools:
  - **Windows**: Visual Studio 2022 C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libasound2-dev`, `libfontconfig1-dev`, `libwayland-dev`, `libxkbcommon-dev`

### Build Steps

```bash
# Clone the repository
git clone https://github.com/Fortunehack45/Recode.git
cd Recode

# Build the optimized release binary
cargo build --release --package recode --package cli

# Run the compiled Recode binary
./target/release/recode
```

---

## 📄 License & Community

Recode is an open-source autonomous AI code editor built on the foundation of the Zed architecture. Upstream core components are licensed under the **GNU General Public License v3.0** (`GPL-3.0-or-later`), with specific modules licensed under the **Apache License 2.0** where marked.

- See [LICENSE-GPL](LICENSE-GPL) and [LICENSE-APACHE](LICENSE-APACHE) for complete license terms.
- Source Code & Issue Tracker: [https://github.com/Fortunehack45/Recode](https://github.com/Fortunehack45/Recode)
