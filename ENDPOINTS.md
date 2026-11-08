# Recode Network Endpoints Directory

This document provides a comprehensive inventory of all network endpoints contacted by Recode, detailing the purpose, transport protocol, payload, and privacy profile for each.

---

## 1. Authentication & User Profile (GitHub)

| Endpoint | Method / Protocol | Purpose | Payload & Privacy |
| :--- | :--- | :--- | :--- |
| `https://github.com/login/device/code` | `POST / TLS` | Request GitHub Device Code | Client ID & `read:user` scope. No credentials sent. |
| `https://github.com/login/device` | Browser URL | User authorization page | User enters code in standard browser window. |
| `https://github.com/login/oauth/access_token` | `POST / TLS` | Poll for user authorization completion | Device code. Returns access token upon confirmation. |
| `https://api.github.com/user` | `GET / TLS` | Fetch public username & avatar URL | Bearer token in header. Returns public profile JSON. |

---

## 2. Artificial Intelligence Providers (Direct BYOK)

Recode never proxies AI requests through intermediate servers. All traffic is direct from client to provider:

| Provider | Endpoint | Protocol | Data Transmitted |
| :--- | :--- | :--- | :--- |
| **Anthropic** | `https://api.anthropic.com/v1/messages` | HTTPS / SSE | User prompt, context buffers, system instructions. Authenticated with user's Anthropic API key. |
| **OpenAI** | `https://api.openai.com/v1/chat/completions` | HTTPS / SSE | User prompt, context buffers, function schemas. Authenticated with user's OpenAI API key. |
| **Google Gemini** | `https://generativelanguage.googleapis.com/...` | HTTPS / SSE | User prompt, multimodal tokens. Authenticated with user's Google API key. |
| **OpenRouter** | `https://openrouter.ai/api/v1/chat/completions` | HTTPS / SSE | User prompt, context buffers. Authenticated with user's OpenRouter API key. |
| **Local Models** | `http://localhost:11434` (Ollama)<br>`http://localhost:1234` (LM Studio) | HTTP / Localhost | Loopback network interface only. Zero external network egress. |

---

## 3. Extension Marketplace & Auto-Updates

| Service | Default Endpoint | Environment Variable Override | Purpose |
| :--- | :--- | :--- | :--- |
| **Extensions** | `https://api.zed.dev/extensions` | `RECODE_EXTENSIONS_URL` | Fetch list of available community extensions, themes, and language servers. |
| **Auto-Updates** | `https://github.com/Fortunehack45/Recode/releases/latest/download` | `RECODE_UPDATES_URL` | Check for new binary releases via `latest.json`. |
| **Documentation** | `https://github.com/Fortunehack45/Recode/wiki` | `RECODE_DOCS_URL` | User help and manual documentation links. |

---

## 4. Real-Time Collaboration Backend

| Service | Endpoint | Protocol | Purpose |
| :--- | :--- | :--- | :--- |
| **Recode Collab** | `wss://recode-collab.fly.dev/rpc` | WSS (WebSocket over TLS) | Multi-user CRDT document synchronization, channel chat, and room presence. |
| **LiveKit WebRTC** | `wss://recode-*.livekit.cloud` | WSS / WebRTC | Ultra-low latency voice audio, video, and screen sharing mesh. |

---

## 5. Telemetry & Tracking Endpoints: NONE

- **Status**: Completely eliminated.
- Outbound telemetry requests have been disabled in code.
