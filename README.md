# Recode

<p align="center">
  <img src="crates/zed/resources/app-icon@2x.png" width="128" height="128" alt="Recode Logo" />
</p>

<p align="center">
  <strong>Autonomous AI code editor. Built for speed, precision, and collaboration.</strong>
</p>

---

## Overview

**Recode** is a native, GPU-accelerated code editor with built-in multi-model AI agent capabilities, inline assistant diffs, and lightning-fast responsiveness.

- **Native Performance**: Written in Rust, powered by GPUI. Zero Electron overhead.
- **Built-in AI Assistant**: Seamless multi-model agent panel (Anthropic Claude, OpenAI, Gemini, DeepSeek, Ollama, and local models).
- **Instant Launch**: Starts up in milliseconds and operates with minimal memory footprint (~45–50MB).
- **1-Click Setup & Auto-Update**: Seamless installation and automatic background updates directly within the application.
- **Multiplayer Collaboration**: Built-in CRDT-backed real-time shared editing.

---

## Installation & Releases

Download standalone release packages for your operating system from [Releases](https://github.com/Fortunehack45/Recode/releases):

- **Windows (1-Click Installer)**: [`RecodeSetup-x64.exe`](https://github.com/Fortunehack45/Recode/releases/latest/download/RecodeSetup-x64.exe) — 1-click install with automatic desktop & start menu shortcuts, context menu ("Open with Recode"), and in-app auto-updating.
- **Windows (Portable)**: `Recode-windows-x64-portable.zip` — Zero-install standalone archive.
- **macOS**: `Recode-macos-arm64.zip` — Universal / Apple Silicon binary.
- **Linux**: `Recode-linux-x64.tar.gz` — Native Linux binary package.

---

## Building Recode from Source

### Prerequisites
- [Rust](https://rustup.rs/) (stable channel)
- Git

### Build Instructions
```bash
# Clone the repository
git clone https://github.com/Fortunehack45/Recode.git
cd Recode

# Build the release binary
cargo build --release --package recode

# Run Recode
./target/release/recode
```

---

## Upstream & Licensing

Recode is an open-source autonomous AI code editor built on the Zed architecture. Upstream source code is licensed primarily under GPL-3.0-or-later, with Apache-2.0 components where marked. See `LICENSE-GPL` and `LICENSE-APACHE` for full license terms.
