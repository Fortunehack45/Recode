# Recode Codebase Guide

This guide orients you to key areas of the **Recode** codebase.

- **Product Metadata**: [`product.json`](./product.json) (defines application name `Recode`, protocol `recode://`, and data directory `.recode`)
- **Package Manifest**: [`package.json`](./package.json) (package name `recode`, scripts for `buildreact`, `compile`, and packaging)
- **AI Workbench UI (React)**: `src/vs/workbench/contrib/cortexide/browser/react/`
- **Workbench AI Integration**: `src/vs/workbench/contrib/cortexide/browser/` (Status bar, Settings tab, Commands)
- **AI Core & LLM Providers**: `src/vs/workbench/contrib/cortexide/common/` (Claude, OpenAI, Gemini, Ollama, DeepSeek)
- **Default Theme**: [`extensions/theme-defaults/themes/recode_dark.json`](./extensions/theme-defaults/themes/recode_dark.json)
- **Multi-Platform Build Automation**: [`.github/workflows/build-recode.yml`](./.github/workflows/build-recode.yml)
- **Application Icons & Assets**:
  - Windows (`.ico`): `resources/win32/code.ico`
  - Linux (`.png`): `resources/linux/code.png`
  - macOS (`.icns`): `resources/darwin/code.icns`
  - In-App & Activity Bar (`.svg`): `src/vs/workbench/browser/media/code-icon.svg`
