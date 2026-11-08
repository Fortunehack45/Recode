# RECODE REBRAND - BASELINE AUDIT (PHASE 0)

## 1. Git Baseline
- **Starting Commit SHA**: `169aba3166cce44b534d70379a694e9b7c8c0963`
- **Starting Branch**: `main`
- **Rebrand Working Branch**: `rebrand/independence`
- **Target Tag Baseline**: `v1.29.9`

## 2. Compilation & Test Verification Status
- **Environment**: Host development machine runs Windows without local `cargo` / `rustc` installed on PATH.
- **Continuous Integration**: Remote GitHub Actions CI runners (`windows-2022`, `macos-14`, `ubuntu-latest`) handle all `cargo test`, `cargo build --release`, and cross-platform packaging.
- **Pre-existing CI Status (v1.29.9 Release Run 42473379206)**:
  - Windows x64: Succeeded (`recode.exe`, `cli.exe`, `auto_update_helper.exe`)
  - macOS ARM64: Succeeded (`Recode.app`, `cli`)
  - Linux x64: Succeeded (`recode`, `cli`)
  - Note: Minor benign warning in release profile: `warning: profile package spec 'zed' in profile 'release' did not match any packages` (due to workspace binary package renaming from `zed` to `recode`).

## 3. Release Binary Sizes (Baseline v1.29.9)
- `RecodeSetup-x64.exe` (Windows NSIS Installer): 84.4 MB (88,541,696 bytes)
- `Recode-windows-x64-portable.zip`: 129.8 MB (136,112,416 bytes)
- `Recode-macos-arm64.zip`: 118.9 MB (124,675,584 bytes)
- `Recode-linux-x64.tar.gz`: 137.0 MB (143,654,912 bytes)

## 4. Verification Checkpoints
- `REBRAND_INVENTORY.md`: 11,130 total occurrences mapped across 7 categories (a-g).
- `FALSE_POSITIVES.txt`: 169 false-positive word stems documented and filtered.
- `DEPENDENCY_LICENSES.md`: 258 workspace crates, 1,319 external dependencies audited, 0 AGPL/prohibited copyleft violations.
