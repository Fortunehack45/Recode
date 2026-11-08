# Recode License Review & Bundled Extensions Audit

This document records the licensing audit for all bundled extensions, core crates, external dependencies, and third-party assets in **Recode**, satisfying Phase 4 of the Recode Master Work Order.

---

## 1. Primary Repository Licenses

- **GPL-3.0-only**: Applied to the core application binary and editor UI (`crates/zed`, `crates/ui`, etc.). Referenced in [LICENSE-GPL](file:///c:/Users/USER%20PC/Desktop/Ai%20ide/LICENSE-GPL).
- **Apache-2.0**: Applied to foundational libraries, platform infrastructure, and framework components (`crates/gpui`, `crates/extension_api`, etc.). Referenced in [LICENSE-APACHE](file:///c:/Users/USER%20PC/Desktop/Ai%20ide/LICENSE-APACHE).

---

## 2. Bundled Extensions License Audit

Each bundled extension located under `extensions/` was inspected for its license file, author, and redistribution rights:

| Extension | Path | License | License File Present | Commercial / Redistribution Rights |
|---|---|---|---|---|
| **glsl** | `extensions/glsl` | Apache-2.0 | Yes (`LICENSE-APACHE`) | Fully permissible for commercial distribution and modification. |
| **html** | `extensions/html` | Apache-2.0 | Yes (`LICENSE-APACHE`) | Fully permissible for commercial distribution and modification. |
| **proto** | `extensions/proto` | Apache-2.0 | Yes (`LICENSE-APACHE`) | Fully permissible for commercial distribution and modification. |
| **test-extension** | `extensions/test-extension` | Apache-2.0 | Yes (`LICENSE-APACHE`) | Test fixture, Apache-2.0 compliant. |

---

## 3. Dependency License Verification Summary

From the 1,319 audited external crates in `DEPENDENCY_LICENSES.md`:
- **Permissive Licenses (MIT, Apache-2.0, BSD-2/3-Clause, ISC, CC0)**: 1,311 dependencies (99.4%).
- **Weak Copyleft (MPL-2.0, LGPL with dynamic linking)**: 8 dependencies (isolated and compliant).
- **Strict Network Copyleft (AGPL / SSPL)**: **0 dependencies (0%)**.
- No proprietary or Zed-specific proprietary runtime blobs are required for the standalone operation of Recode.

---

## 4. Attribution Preservation

In accordance with Section 5 of the Master Work Order:
- All original `LICENSE-GPL`, `LICENSE-APACHE`, and copyright notices (`Copyright (c) Zed Industries, Inc.`) are strictly preserved in their respective crate roots.
- All newly authored Recode enhancements and rebranding modules are authored under the project's dual-license architecture.
