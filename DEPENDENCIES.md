# Recode Dependency Manifest & Architecture Inventory

## Overview

Recode is a high-performance native desktop application written in Rust. It utilizes a modular multi-crate workspace architecture to ensure strict separation of concerns, fast incremental compilation, and robust isolation between the editor frontend and collaboration backend.

---

## 1. Dependency Licensing Breakdown

A comprehensive audit of the 1,319 external crate dependencies across the workspace confirms complete legal compliance:

| License Type | Crate Count (Approx.) | Percentage | Permissibility Status |
| :--- | :--- | :--- | :--- |
| **MIT** | 895 | ~67.8% | ✅ Permissive |
| **Apache-2.0** | 318 | ~24.1% | ✅ Permissive |
| **BSD-2-Clause / BSD-3-Clause** | 78 | ~5.9% | ✅ Permissive |
| **ISC / Zlib / CC0** | 28 | ~2.1% | ✅ Permissive |
| **AGPL / Viral Copyleft** | **0** | **0.0%** | ❌ Strictly Prohibited |

---

## 2. Core Functional Dependency Stacks

### A. UI Engine & System Windowing
- `gpui`: Recode's custom reactive GPU-accelerated UI framework.
- `windows-sys` / `windows`: Direct Win32 APIs for custom non-client window management and DPI awareness.
- `winit`: Cross-platform window creation and event loop primitives.
- `blade-graphics` / `vulkano`: Cross-platform GPU rasterization pipelines.

### B. Text Buffer, Tree-Sitter & Language Protocols
- `sum_tree`: Copy-on-write B-tree implementation powering fast syntax-aware text buffers.
- `tree-sitter`: Incremental syntax tree parsing for 40+ programming languages.
- `lsp-types`: Protocol specifications for Language Server Protocol communication.

### C. AI Agent & Network Connectivity
- `reqwest`: Asynchronous HTTP/1.1 and HTTP/2 client with native TLS support.
- `eventsource-stream`: Server-Sent Events (SSE) stream parser for streaming LLM generation tokens.
- `serde` & `serde_json`: High-speed serialization and deserialization.
- `keyring`: Native OS credential store abstraction (Windows Credential Manager, Apple Keychain, Linux Secret Service).

### D. Collaboration Backend (`crates/collab`)
- `axum`: Ergonomic and modular web framework built with Tokio and Tower.
- `sea-orm`: Async & dynamic Object-Relational Mapping library for PostgreSQL.
- `livekit-api`: Token minting and room coordination client for LiveKit WebRTC.
- `tokio`: Asynchronous runtime for concurrent network and task scheduling.
