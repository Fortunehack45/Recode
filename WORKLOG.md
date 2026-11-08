# RECODE ENGINEERING WORKLOG

## Project Overview
Recode: Independence, Full Rebrand, and Own Collaboration Backend.

---

## 2026-11-08 - Phase 0: Baseline & Inventory
- **What Was Done**:
  - Scanned codebase for brand strings (`Zed`, `Zed Industries`, `zed.dev`, etc.). Mapped 11,130 mentions into categorized inventory.
  - Audited 1,319 external crate dependencies across workspace. Found zero AGPL or copyleft license violations.
  - Formulated baseline metric reports: `BASELINE.md`, `REBRAND_INVENTORY.md`, `DEPENDENCY_LICENSES.md`, `FALSE_POSITIVES.txt`.
- **What Was Learned**:
  - Identified false-positive word stems (`analyzed`, `customized`, `unmatched`, etc.) that must not be altered during rebrand.
  - Verified dual licensing: GPL-3.0 and Apache-2.0.

---

## 2026-11-08 - Phase 1: Cut Hosted AI, Billing, and Subscriptions
- **What Was Done**:
  - Completely excised Zed cloud-hosted AI client endpoints, Zed Pro billing tiers, trial banners, and remote cloud search.
  - Ensured local models (Ollama, LM Studio, Llama.cpp) and BYOK providers (Anthropic, OpenAI, Google Gemini, OpenRouter, DeepSeek, xAI, Mistral) work completely offline and unauthenticated.
  - Total changes: 33 files, -4,452 lines deleted.
- **What Was Learned**:
  - Desktop editor functions independently with pure BYOK and local model backends.

---

## 2026-11-08 - Phase 2: Eliminate Dead Zed Services & Wire Central Endpoints
- **What Was Done**:
  - Neutered all telemetry pings and event pipelines in `telemetry.rs`.
  - Created central endpoint configurations in `crates/client/src/zed_urls.rs` and `recode_urls.rs`.
  - Provided clean environment variable overrides (`RECODE_API_URL`, `RECODE_COLLAB_URL`, `RECODE_UPDATES_URL`, `RECODE_EXTENSIONS_URL`, `RECODE_DOCS_URL`).
- **What Was Learned**:
  - Extensions service can safely fallback to public registry (`https://api.zed.dev`) without errors.

---

## 2026-11-08 - Phase 3: GitHub Device Flow, Taskbar Fix, Extensions & BYOK Onboarding
- **What Was Done**:
  - **Windows Taskbar Maximize Bug**: Fixed custom frame clipping in `crates/gpui_windows/src/events.rs`. Added check for `WS_MAXIMIZE` and clamped `rgrc[0]` to `rcWork`.
  - **GitHub Authentication**: Replaced local browser redirect (`/native_app_signin`) with direct GitHub OAuth Device Flow (`https://github.com/login/device/code`). Profile (name, avatar, ID) retrieved directly from `https://api.github.com/user`.
  - **Extension Registry**: Fixed 404 on `/extensions` by routing requests to `RECODE_EXTENSIONS_URL` and adding resilient offline fallback.
  - **BYOK Onboarding**: Clarified privacy reassurance in onboarding UI that keys stay in local keychain.
- **What Was Learned**:
  - Windows custom non-client window sizing (`WM_NCCALCSIZE`) can fire before `IsZoomed` returns true during maximize transitions.

---

## 2026-11-08 - Phase 4: Release Channels, Docs URLs, OWNERSHIP.md & LICENSE_REVIEW.md
- **What Was Done**:
  - Rebranded release channels (`Stable`, `Preview`, `Nightly`, `Dev`) with environment overrides `RECODE_RELEASE_CHANNEL` and `RECODE_APP_VERSION`.
  - Created `OWNERSHIP.md`: Detailed specification for macOS codesigning/notarization, Windows Authenticode/Azure Trusted Signing, Linux packaging, and CI secrets checklist.
  - Created `LICENSE_REVIEW.md`: Full audit documenting 4 bundled extensions under Apache-2.0 and verification of 0 AGPL dependencies.
- **What Was Learned**:
  - Code signing procedures require specific HSM/Azure cloud credentials documented in `OWNERSHIP.md`.

---

## 2026-11-08 - Phase 5: The Full Rename
- **What Was Done**:
  - Configured project paths in `crates/paths/src/paths.rs` to use `.recode` (`.recode/settings.json`, `.recode/tasks.json`, `.recode/debug.json`) and remote server dirs `.recode_server`.
  - Rebranded URL scheme in `crates/agent_skills`, `crates/install_cli`, and `crates/zed/src/zed/open_listener.rs` to support `recode://` while maintaining backwards-compatible normalization.
  - Rebranded CLI launcher strings, help text, and executable candidates in `crates/cli/src/main.rs`.
  - Replicated brand icons (`recode_agent.svg`, `ai_recode.svg`, etc.) and registered enum variants in `crates/icons/src/icons.rs`.
- **What Was Learned**:
  - Enum and asset parity tests enforce strict matching between SVG filenames and `IconName` enum variants.

---

## 2026-11-08 - Phase 6: Documentation & Repository Files
- **What Was Done**:
  - Verified and enhanced `README.md` with high-resolution screenshot embeds (`recode-welcome.png` and `recode-editor-agent.jpg`) with detailed feature walkthroughs.
  - Authored `SECURITY.md` establishing responsible disclosure procedures and security architecture principles (BYOK keychain isolation, zero telemetry).
  - Authored `PRIVACY_NOTES.md` documenting zero telemetry, local crash logging, direct client-to-provider HTTPS inference, and unauthenticated offline operations.
  - Updated `docs/book.toml` branding from Zed to Recode.
- **What Was Learned**:
  - All public facing docs and repository entry points now consistently present the Recode identity.

---

## 2026-11-08 - Phase 7: Recode Collab Backend (Fly.io + Supabase + LiveKit)
- **What Was Done**:
  - Updated `crates/collab/src/auth.rs` to validate GitHub bearer access tokens directly against the GitHub API (`https://api.github.com/user`), eliminating Zed Cloud dependency.
  - Updated `crates/collab/src/main.rs` service banner to `recode:{mode}`.
  - Created production-ready `fly.toml` for `recode-collab` deploying to Fly.io (`iad` region, port 8080, health probe `/healthz`).
  - Verified SeaORM migrations compatibility with Supabase PostgreSQL and LiveKit WebRTC client configuration.
- **What Was Learned**:
  - Self-hosted collab server can run autonomously with zero Zed Cloud dependencies by utilizing direct GitHub OAuth validation and Supabase Postgres.

---

## Open Questions & Decisions
- None currently blocking. Ready to advance to Phase 8 (Audit, Hardening, and the 11 Architectural Documents).
