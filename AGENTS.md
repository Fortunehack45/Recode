# Recode AI Agents Instructions

This file provides instructions for AI coding agents working with the **Recode** codebase.

## Project Overview
- **Brand Name**: Recode
- **Base Architecture**: VS Code 1.118.1 with native AI workbench integration.
- **Key Modules**:
  - `src/vs/workbench/contrib/cortexide/`: All AI capabilities, chat, inline diffs, and LLM providers.
  - `package.json`: Main manifest (`name`: `recode`).
  - `product.json`: Product metadata (`nameShort`: `Recode`, `nameLong`: `Recode`, `dataFolderName`: `.recode`).
  - `.github/workflows/build-recode.yml`: Multi-platform release build automation.
