# Recode Feature Parity & Verification Checklist

This document tracks feature parity between upstream Zed and the independent **Recode** editor.

| Functional Area | Upstream Zed | Recode Editor | Parity Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **GPU-Accelerated Rendering** | GPUI (Metal, DirectX, Vulkan) | GPUI (Metal, DirectX, Vulkan) | ✅ **100% Identical** | Native GPU rasterization, 120+ FPS, sub-50ms cold boot. |
| **Language Support & Syntax** | Tree-sitter & LSP | Tree-sitter & LSP | ✅ **100% Identical** | Full tree-sitter grammars and LSP protocol support. |
| **Integrated Terminal** | Alacritty / ConPTY / PTY | Alacritty / ConPTY / PTY | ✅ **100% Identical** | Full Windows ConPTY, macOS, and Linux PTY integration. |
| **Windows Taskbar Maximize** | Known bug (taskbar clipping) | **Fixed** (`WS_MAXIMIZE` clamping) | 🌟 **Superior** | Maximized window bounds correctly clamped to `rcWork`. |
| **Extension Marketplace** | Proprietary registry | Public registry / local MCP | ✅ **100% Compatible** | Extension installation, language servers, and themes work. |
| **Model Context Protocol (MCP)** | Basic client | Full multi-server MCP client | ✅ **100% Supported** | Connects to standard MCP servers (SQLite, GitHub, local tools). |
| **AI Architecture** | Hosted proxy + subscriptions | **Pure BYOK & Local Models** | 🌟 **Superior** | Direct client-to-provider HTTPS. Zero subscription lock-in. |
| **AI Privacy & Key Storage** | Cloud account binding | **Native Hardware Keychain** | 🌟 **Superior** | Keys stored in OS keychain. Zero middleman logging. |
| **Telemetry & Tracking** | Cloud telemetry pings | **Zero Telemetry** | 🌟 **Superior** | Telemetry pipelines eliminated; zero network tracking. |
| **Authentication System** | Hosted account server | **GitHub Device Flow** | ✅ **100% Independent** | Direct OAuth with GitHub (`/login/device`). Sign-in is optional. |
| **User Profile Rendering** | Hosted database lookup | **Live GitHub Profile & Avatar** | ✅ **100% Parity** | Real avatar and username fetched from GitHub API. |
| **Channels & Shared Projects** | Upstream cloud collab | **Recode Collab (Fly.io + Supabase)** | ✅ **100% Architecture Parity** | CRDT multi-user editing over WebSockets. |
| **Voice & Call Rooms** | Upstream LiveKit mesh | **Recode LiveKit WebRTC** | ✅ **100% Parity** | Token generation and audio streaming via LiveKit Cloud. |
| **Settings & Project Config** | `.zed/settings.json` | `.recode/settings.json` | ✅ **Rebranded** | Local and global `.recode` folder configuration. |
| **CLI Companion** | `zed <path>` | `recode <path>` | ✅ **Rebranded** | Full CLI binary support with `recode` executable names. |
| **Custom URL Scheme** | `zed://` | `recode://` (with `zed://` alias) | ✅ **Enhanced** | Primary `recode://` with legacy fallback normalization. |
