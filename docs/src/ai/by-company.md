---
title: AI by Company - Recode
description: Find the right Recode setup path for OpenAI, ChatGPT, Codex, Claude, Gemini, Copilot, Cursor, OpenCode, Pi, Poolside, OpenRouter, Bedrock, local models, and other AI tools.
---

# AI by Company

Use this page when you know the company, subscription, provider, agent, or CLI you want to use in Recode.

For detailed setup, follow the links in the `Setup` column. This page answers routing questions; it does not replace the setup pages.

## Recode {#recode}

| Path                 | Support level  | What you get                      | Account / billing       | Setup                                                |
| -------------------- | -------------- | --------------------------------- | ----------------------- | ---------------------------------------------------- |
| Recode-hosted models    | Built into Recode | Hosted models for Recode AI features | Billed through Recode      | [Recode-Hosted Models](../account/recode-hosted-models.md) |
| Zeta edit prediction | Built into Recode | Edit predictions while you type   | Included by plan limits | [Edit Prediction](./edit-prediction.md)              |

## OpenAI / ChatGPT / Codex {#openai-chatgpt-codex}

| Path                 | Support level     | What you get                                          | Account / billing     | Setup                                                                     |
| -------------------- | ----------------- | ----------------------------------------------------- | --------------------- | ------------------------------------------------------------------------- |
| ChatGPT Subscription | Configured in Recode | Subscription-backed OpenAI models for Recode AI features | ChatGPT Plus or Pro   | [Use an Existing Subscription](./use-an-existing-subscription.md#chatgpt) |
| OpenAI API           | Configured in Recode | OpenAI models through API access                      | OpenAI API billing    | [Use API Access](./use-api-access.md#openai)                              |
| Codex via ACP        | Hosted in Recode     | Codex in an External Agent thread                     | Owned by Codex/OpenAI | [External Agents](./external-agents.md#codex-cli)                         |
| Codex CLI            | Run in terminal   | Native Codex CLI experience in a Terminal Thread      | Owned by Codex/OpenAI | [Terminal Threads](./terminal-threads.md)                                 |

## Anthropic / Claude / Claude Code {#anthropic-claude}

| Path                 | Support level     | What you get                                       | Account / billing                       | Setup                                                |
| -------------------- | ----------------- | -------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Anthropic API        | Configured in Recode | Claude models through API access                   | Anthropic API billing                   | [Use API Access](./use-api-access.md#anthropic)      |
| Claude Agent via ACP | Hosted in Recode     | Claude in an External Agent thread                 | Owned by Claude/Anthropic               | [External Agents](./external-agents.md#claude-agent) |
| Claude Code CLI      | Run in terminal   | Native Claude Code experience in a Terminal Thread | Claude subscription or Claude Code auth | [Terminal Threads](./terminal-threads.md)            |

Claude Pro and Max subscriptions are separate from Anthropic API credits. If you want Claude subscription-limit behavior, use Claude Agent or Claude Code where supported. See [Use an Existing Subscription](./use-an-existing-subscription.md#claude).

## Google / Gemini / Gemini CLI {#google-gemini}

| Path          | Support level                    | What you get                                      | Account / billing     | Setup                                                                                         |
| ------------- | -------------------------------- | ------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| Google AI API | Configured in Recode                | Gemini models through API access                  | Google AI API billing | [Use API Access](./use-api-access.md#google-ai)                                               |
| Gemini CLI    | Hosted in Recode or run in terminal | Gemini CLI as an External Agent or native CLI/TUI | Owned by Gemini CLI   | [External Agents](./external-agents.md#gemini-cli), [Terminal Threads](./terminal-threads.md) |

## GitHub / Copilot {#github-copilot}

| Path                    | Support level     | What you get                                         | Account / billing           | Setup                                                                            |
| ----------------------- | ----------------- | ---------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------- |
| GitHub Copilot Chat     | Configured in Recode | Copilot Chat models for Recode AI features              | GitHub Copilot/Copilot Chat | [Use an Existing Subscription](./use-an-existing-subscription.md#github-copilot) |
| Copilot edit prediction | Built into Recode    | Edit prediction provider option                      | GitHub Copilot              | [Edit Prediction](./edit-prediction.md)                                          |
| Copilot External Agent  | Hosted in Recode     | Copilot in an External Agent thread, where available | Owned by Copilot            | [External Agents](./external-agents.md#copilot)                                  |
| Copilot CLI             | Run in terminal   | Native CLI experience, where available               | Owned by Copilot            | [Terminal Threads](./terminal-threads.md)                                        |

## OpenCode {#opencode}

| Path                    | Support level     | What you get                                          | Account / billing                                    | Setup                                            |
| ----------------------- | ----------------- | ----------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| OpenCode provider       | Configured in Recode | OpenCode models for Recode AI features                   | OpenCode API key; subscription tier affects available models | [Use API Access](./use-api-access.md#opencode)   |
| OpenCode External Agent | Hosted in Recode     | OpenCode in an External Agent thread, where available | Owned by OpenCode                                    | [External Agents](./external-agents.md#opencode) |
| `opencode` CLI          | Run in terminal   | Native OpenCode CLI experience                        | Owned by OpenCode                                    | [Terminal Threads](./terminal-threads.md)        |

## Cursor {#cursor}

| Path                  | Support level   | What you get                                           | Account / billing           | Setup                                          |
| --------------------- | --------------- | ------------------------------------------------------ | --------------------------- | ---------------------------------------------- |
| Cursor External Agent | Hosted in Recode   | Cursor in an External Agent thread, where available    | Cursor account/subscription | [External Agents](./external-agents.md#cursor) |
| Cursor CLI/TUI        | Run in terminal | Native Cursor command-line experience, where available | Cursor account/subscription | [Terminal Threads](./terminal-threads.md)      |

Cursor subscriptions do not configure Recode's LLM provider settings. If you want to use a work Cursor subscription in Recode, use the Cursor External Agent or a Terminal Threads workflow where available.

## Pi Coding Agent {#pi}

| Path            | Support level   | What you get                                       | Account / billing | Setup                                      |
| --------------- | --------------- | -------------------------------------------------- | ----------------- | ------------------------------------------ |
| Pi Coding Agent | Hosted in Recode   | Pi in an External Agent thread, where available    | Owned by Pi       | [External Agents](./external-agents.md#pi) |
| Pi CLI/TUI      | Run in terminal | Native Pi command-line experience, where available | Owned by Pi       | [Terminal Threads](./terminal-threads.md)  |

Pi is an agent harness, not a Recode LLM subscription. Pi may support provider auth such as ChatGPT, Claude, or Copilot through its own setup flow.

## Poolside {#poolside}

| Path                    | Support level   | What you get                         | Account / billing               | Setup                                            |
| ----------------------- | --------------- | ------------------------------------ | ------------------------------- | ------------------------------------------------ |
| Poolside External Agent | Hosted in Recode   | Poolside in an External Agent thread | Poolside or configured provider | [External Agents](./external-agents.md#poolside) |
| `pool` CLI              | Run in terminal | Native Poolside Agent CLI experience | Poolside or configured provider | [Terminal Threads](./terminal-threads.md)        |

Install Poolside from the ACP Registry, configure Recode with the Poolside Agent CLI, or add Poolside as a Custom Agent. See [External Agents](./external-agents.md#poolside) for setup steps and platform-specific details.

## DeepSeek {#deepseek}

| Path         | Support level     | What you get                        | Account / billing                               | Setup                                          |
| ------------ | ----------------- | ----------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| DeepSeek API | Configured in Recode | DeepSeek models for Recode AI features | DeepSeek API credits, top-ups, or usage billing | [Use API Access](./use-api-access.md#deepseek) |

Paid DeepSeek usage is API access in Recode, not subscription sign-in.

## Gateways and Cloud Platforms {#gateways}

| Provider          | Support level     | What you get                         | Account / billing  | Setup                                                 |
| ----------------- | ----------------- | ------------------------------------ | ------------------ | ----------------------------------------------------- |
| OpenRouter        | Configured in Recode | Gateway access to multiple providers | OpenRouter billing | [Use a Gateway](./use-a-gateway.md#openrouter)        |
| Vercel AI Gateway | Configured in Recode | Gateway access through Vercel        | Vercel billing     | [Use a Gateway](./use-a-gateway.md#vercel-ai-gateway) |
| Amazon Bedrock    | Configured in Recode | AWS-hosted model access              | AWS billing        | [Use a Gateway](./use-a-gateway.md#amazon-bedrock)    |

## Local Models {#local-models}

| Tool                              | Support level     | What you get                           | Account / billing | Setup                                                         |
| --------------------------------- | ----------------- | -------------------------------------- | ----------------- | ------------------------------------------------------------- |
| llama.cpp                         | Configured in Recode | Local models for Recode AI features       | Local/self-hosted | [Use a Local Model](./use-a-local-model.md#llama-cpp)         |
| LM Studio                         | Configured in Recode | Local models for Recode AI features       | Local/self-hosted | [Use a Local Model](./use-a-local-model.md#lm-studio)         |
| Ollama                            | Configured in Recode | Local models for Recode AI features       | Local/self-hosted | [Use a Local Model](./use-a-local-model.md#ollama)            |
| Local OpenAI-compatible server    | Configured in Recode | Local or self-hosted model endpoint    | Local/self-hosted | [Use a Local Model](./use-a-local-model.md#openai-compatible) |
| Local/self-hosted edit prediction | Configured in Recode | Edit predictions from a local provider | Local/self-hosted | [Edit Prediction](./edit-prediction.md)                       |

## Other API Providers {#other-api-providers}

For Mistral, xAI, and OpenAI-compatible endpoints that are not listed above, see [Use API Access](./use-api-access.md).
