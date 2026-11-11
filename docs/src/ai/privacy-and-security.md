---
title: AI Privacy - Recode
description: Understand how Recode handles AI prompts, code context, model requests, provider data boundaries, feedback, training data, and privacy controls.
---

# AI Privacy & Security

This page explains the privacy and trust boundaries for AI features in Recode,
including how prompts, code context, and model configurations are handled.

Recode does not retain your prompts or code context by default. For
model requests, Recode has strict no-training commitments.

Recode operates under a privacy-first model: your data belongs to you.

| Feature                                                       | Data recipient                                    | Privacy commitments                                                                                                                                                                                               | Learn more                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Local Offline Models (Ollama)                                 | Your local machine                                | 100% offline. Zero data ever leaves your computer or network.                                                                                                                                                     | [Local AI Setup](./agent-settings.md)                                                              |
| [Provider API keys](./use-api-access.md)                      | The configured provider                           | The provider handles requests under its own terms. Provider keys saved through Recode are stored in the system keychain, not in `settings.json`.                                                                     | [Use API Access](./use-api-access.md)                                                             |
| [Agent tools](./tools.md), [MCP](./mcp.md), and integrations  | Recode, configured MCP servers, and external systems | Tools can read, edit, search, run commands, fetch URLs, or call external systems depending on profile, MCP server, and tool permission settings.                                                                  | [Agent Profiles](./agent-profiles.md), [Tool Permissions](./tool-permissions.md), [MCP](./mcp.md) |
| Project trust and instructions                                | Recode and the trusted worktree                   | Project-local instructions and skills are loaded from trusted worktrees.                                                                                                                                          | [Skills](./skills.md), [Instructions](./instructions.md)                                           |

## Data Retention and Training

When using external API providers, requests are sent directly to the respective model API. Recode does not store, intercept, or use your code or prompts to train foundation models.

## Related Resources

- [Privacy for Business](../business/privacy.md): Enterprise data protections.
- [Privacy Policy](https://recode.dev/privacy-policy): Recode's privacy policy.
- [Subprocessors](https://recode.dev/subprocessors): Recode's third-party subprocessors.
- [Terms of Service](https://recode.dev/terms): Recode's terms.
