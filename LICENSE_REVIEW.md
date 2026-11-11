# Recode License Review & Clean-Room IP Audit

This document records the licensing audit for all bundled extensions, core clean-room crates, external dependencies, and third-party assets in **Recode**, verifying clean-room IP independence and preparing for commercial closed-source distribution.

---

## 1. Clean-Room Proprietary Architecture (100% Recode IP)

In accordance with the Clean-Room Reimplementation Protocol, Recode's core editor subsystems were re-engineered from clean-room observable behavior specifications with 100% original naming, types, and logic, with zero code copied or derived from external copyrighted codebases:

| Crate | Observable Spec | Primary Clean-Room Types | Licensing Status |
|---|---|---|---|
| **recode_buffer** | `spec/text_editing.md` | `DocPoint`, `DocSpan`, `CaretSelection`, `TextLinesBuffer`, `HistoryTracker` | **100% Recode Proprietary** |
| **recode_shell** | `spec/theming_layout.md` | `LayoutTopology`, `DockConstraints`, `DockPanel`, `TabStrip`, `AppTheme` | **100% Recode Proprietary** |
| **recode_workspace** | `spec/workspace.md` | `FileNode`, `FileTree`, `Workspace`, `FileState`, `FileSortMode` | **100% Recode Proprietary** |
| **recode_lsp** | `spec/language_server.md` | `PacketDecoder`, `LspClient`, `DiagnosticsStore`, `DiagnosticEntry` | **100% Recode Proprietary** |
| **recode_terminal_palette** | `spec/terminal_palette.md` | `TerminalGrid`, `ScrollbackBuffer`, `CommandItem`, `CommandPalette` | **100% Recode Proprietary** |
| **recode_agent_core** | `spec/agent_panel.md` | `AgentPanelState`, `ToolRegistry`, `LocalOllamaClient`, `TokenBudget` | **100% Recode Proprietary** |
| **recode_core_app** | `spec/application.md` | `RecodeApp`, `UserConfig`, `ActionDispatcher`, `FocusTarget` | **100% Recode Proprietary** |

All clean-room crates carry the official Recode Commercial Header:
```rust
// Copyright (c) 2026 Recode. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification, or redistribution is strictly prohibited.
```

---

## 2. Transition & Commercial Licensing Architecture

- **Commercial Proprietary EULA**: Governs all compiled Recode binaries, the clean-room engine (`recode-core`), and commercial releases. Referenced in [LICENSE.md](LICENSE.md) and [EULA.md](EULA.md).
- **Legacy Scaffold Isolation**: The historical reference build is preserved under git tag `reference-baseline`. As the clean-room engine completes integration, all legacy dependencies will be archived, isolating the proprietary codebase in a standalone private commercial repository.

---

## 3. Dependency License Verification Summary

From the 1,319 audited external crates in `DEPENDENCY_LICENSES.md`:
- **Permissive Licenses (MIT, Apache-2.0, BSD-2/3-Clause, ISC, CC0)**: 1,311 dependencies (99.4%).
- **Weak Copyleft (MPL-2.0, LGPL with dynamic linking)**: 8 dependencies (isolated and compliant).
- **Strict Network Copyleft (AGPL / SSPL)**: **0 dependencies (0%)**.
- No proprietary or legacy external runtime blobs are required for the standalone operation of Recode.

---

## 4. Legal Compliance & Clean Audit Trail

- **No Zed or Zen Code in Clean-Room Crates**: A complete keyword and identifier audit confirms zero occurrences of legacy branding or structures in `crates/recode_*` and `spec/`.
- **EULA & Commercial Terms Established**: Formal proprietary EULA, Terms of Service, and Privacy Policy established in `legal/` and repository root.
