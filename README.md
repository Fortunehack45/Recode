# Recode

<div align="center">
  <img src="./src/vs/workbench/browser/media/code-icon.svg" alt="Recode Logo" width="160" height="160" />

  <h3>The Open-Source Autonomous AI Code Editor</h3>

  <p>
    <b>Privacy-first • Multi-Provider • Fast • Extensible</b>
  </p>

  <p>
    <a href="https://github.com/Fortunehack45/Recode/releases"><img src="https://img.shields.io/github/v/release/Fortunehack45/Recode?style=flat-square&color=blue" alt="Latest Release" /></a>
    <a href="https://github.com/Fortunehack45/Recode/actions/workflows/build-recode.yml"><img src="https://img.shields.io/github/actions/workflow/status/Fortunehack45/Recode/build-recode.yml?style=flat-square&label=build" alt="Build Status" /></a>
    <a href="LICENSE.txt"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License" /></a>
  </p>
</div>

---

## Overview

**Recode** is an open-source AI-native code editor designed for developers who value complete control over their tools, models, and data.

Built on the proven foundation of VS Code (1.118.1), Recode brings first-class AI capabilities directly into your workflow while ensuring your source code and prompts remain private.

### Key Highlights

- 🤖 **Multi-Provider AI**: Native integration with Anthropic Claude, OpenAI, Google Gemini, Ollama, DeepSeek, Groq, OpenRouter, and local models.
- 🔒 **Zero Data Retention**: Your code and API keys connect directly to your chosen provider from your local machine. No telemetry or intermediate servers.
- ⚡ **Agentic Coding & Inline Edits**: Multi-file editing, codebase querying, error detection, automated code reviews, and streaming diff previews.
- 🎨 **Modern Experience**: Clean minimalist UI, bespoke **Recode Dark** theme, and native performance across Windows, macOS, and Linux.
- 🧩 **100% Extension Compatible**: Compatible with Open VSX and VS Code extensions.

---

## Downloads & Installation

Pre-built binaries for Windows, macOS, and Linux are automatically compiled on release:

- **Windows**: [Download `Recode-win32-x64.zip`](https://github.com/Fortunehack45/Recode/releases)
- **Linux**: [Download `Recode-linux-x64.tar.gz`](https://github.com/Fortunehack45/Recode/releases)
- **macOS**: [Download `Recode-darwin-arm64.zip`](https://github.com/Fortunehack45/Recode/releases)

---

## Quick Start (Development)

To build and run Recode from source:

### Prerequisites

- **Node.js**: `v22.22.1` (or matching `.nvmrc`)
- **Python**: 3.10+
- **C/C++ Build Tools**:
  - **Windows**: Visual Studio 2022 with "Desktop development with C++"
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Ubuntu/Debian)**: `sudo apt-get install -y build-essential g++ libx11-dev libxkbfile-dev libsecret-1-dev libkrb5-dev fakeroot rpm`

### Installation & Launch

```bash
# Clone the repository
git clone https://github.com/Fortunehack45/Recode.git
cd Recode

# Install dependencies
npm install --legacy-peer-deps

# Build the React AI workbench
npm run buildreact

# Launch Recode in development mode
npm run electron
```

---

## Architecture & Codebase Guide

Recode integrates AI capabilities directly into the workbench:

- **Core AI Integration**: [`src/vs/workbench/contrib/cortexide/`](./src/vs/workbench/contrib/cortexide/)
  - `browser/react/`: React-based AI chat, prompt bar, and agent UI.
  - `browser/`: Workbench status bar, settings pane, commands, and review services.
  - `common/`: Multi-provider LLM clients, token streaming, tools, and privacy models.
- **Product Configuration**: [`product.json`](./product.json)
- **Theme**: [`extensions/theme-defaults/themes/recode_dark.json`](./extensions/theme-defaults/themes/recode_dark.json)
- **CI/CD Pipeline**: [`.github/workflows/build-recode.yml`](./.github/workflows/build-recode.yml)

For details on contributing, please read [HOW_TO_CONTRIBUTE.md](./HOW_TO_CONTRIBUTE.md).

---

## Contributing

Contributions to Recode are welcome! Whether filing bug reports, adding provider connectors, optimizing latency, or improving documentation:

1. Fork the repo and create your branch from `main`.
2. Follow our coding guidelines in [HOW_TO_CONTRIBUTE.md](./HOW_TO_CONTRIBUTE.md).
3. Submit a Pull Request.

---

## License

Recode is licensed under the [MIT License](./LICENSE.txt).
