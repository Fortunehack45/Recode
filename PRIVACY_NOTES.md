# Recode Privacy Notes & Data Flow Architecture

## Privacy by Design

Recode is designed from the ground up to respect user sovereignty, confidentiality, and data privacy. Unlike closed-source, cloud-dependent editors that monetize telemetry or route code through proprietary inference servers, Recode is fully independent.

---

## 1. Telemetry and Analytics: None
- **Status**: Disabled / Removed.
- All upstream telemetry pipelines, diagnostic beacons, crash telemetry pings, and usage tracking hooks have been excised.
- Recode makes zero automated outbound network requests for telemetry, marketing analytics, or user profiling.

---

## 2. Crash Reporting and Diagnostics
- Diagnostic logs are written strictly to your local filesystem:
  - **Windows**: `%LOCALAPPDATA%\Recode\logs\Recode.log`
  - **macOS**: `~/Library/Logs/Recode/Recode.log`
  - **Linux**: `~/.local/state/recode/logs/recode.log`
- Recode never uploads crash dumps or stack traces to any remote server without explicit user intervention.

---

## 3. Artificial Intelligence & LLM Data Flow
- **Direct Provider Connection (BYOK)**:
  - When you prompt the Recode AI Agent, requests travel directly from your desktop to the configured AI provider's API endpoint over HTTPS TLS:
    - Anthropic: `https://api.anthropic.com`
    - OpenAI: `https://api.openai.com`
    - Google Gemini: `https://generativelanguage.googleapis.com`
    - OpenRouter: `https://openrouter.ai/api`
    - Local Models (Ollama, LM Studio, Llama.cpp): `http://localhost:...` (never leaves your machine)
  - No prompt, file content, diff, or tool call passes through any Recode proxy, relay, or cloud cache.
- **Keychain Storage**:
  - API keys are securely persisted in your operating system's native hardware-backed credential store:
    - Windows Credential Manager (`wincred`)
    - macOS Keychain
    - Linux FreeDesktop Secret Service
  - Keys are never written to plaintext config files or synced to the cloud.

---

## 4. GitHub Sign-in (Optional)
- **Zero Lock-in**:
  - Sign-in is 100% optional. The entire editor, local AI, BYOK inference, language servers, terminal, and extension ecosystem function completely offline without signing in.
- **OAuth Device Flow**:
  - Recode uses GitHub's standard OAuth Device Flow (`https://github.com/login/device`).
  - No secret application keys or passwords are typed into the editor.
  - The access token is used exclusively to fetch your public GitHub handle and avatar URL (`https://api.github.com/user`) to render your profile indicator in the title bar.

---

## 5. Extensions & Marketplace
- Extensions and Language Server Protocol (LSP) binaries are retrieved directly from official upstream open-source package repositories and the public extension registry.
- Extension installation is fully explicit and on-demand.

---

## 6. Real-Time Collaboration (Collab)
- When participating in multi-user collaboration channels:
  - Communication is authenticated over WebSockets and WebRTC.
  - Channel CRDT operations (cursor movements, text edits) are distributed exclusively to active participants in the session.
  - No buffer contents or chat transcripts are permanently stored or indexed for training.
