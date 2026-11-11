---
title: Admin Controls - Recode Business
description: Configure AI, collaboration, and data sharing settings for your entire Recode Business organization.
---

# Admin Controls

Owners and admins can configure settings that apply to every member of the organization.

Most controls apply server-side to anything that routes through Recode's hosted infrastructure. Some, like the Collaboration toggle, are enforced client-side. These controls don't restrict [bring-your-own-key (BYOK) configurations](../ai/llm-providers.md), [gateways](../ai/use-a-gateway.md), [local or self-hosted models](../ai/use-a-local-model.md), [External Agents](../ai/external-agents.md), or [Terminal Threads](../ai/terminal-threads.md), since those work locally and independently of Recode's servers.

## Accessing admin controls

Admin controls are available to owners and admins in the organization dashboard at [dashboard.recode.dev](https://dashboard.recode.dev). Navigate to your organization, then select Data & Privacy from the sidebar to configure these settings.

---

## Collaboration

The **Collaboration** toggle controls whether members can use Recode's real-time collaboration features, including [Channels](../collaboration/channels.md), shared projects, and voice chat. Collaboration is off by default for Business organizations.

## Hosted AI models

The **Recode Model Provider** toggle controls whether members can use Recode's [hosted AI models](../account/recode-hosted-models.md):

- **On:** Members can use Recode's hosted models for AI features.
- **Off:** Members must bring their own model access via [LLM Providers](../ai/llm-providers.md) or use [External Agents](../ai/external-agents.md) or offline Ollama for AI features.

## Edit Predictions

The **Edit Prediction** toggle controls whether members can use Recode's hosted [Edit Predictions](../ai/edit-prediction.md). Members using third-party providers or local models for edit predictions are not affected.

**Edit Prediction Feedback** controls whether members can submit feedback on edit predictions. This setting is only configurable when Edit Prediction is enabled.

## Agent Thread Feedback

The **Agent Thread Feedback** toggle controls whether members can submit feedback on agent thread responses. When disabled, members cannot rate or provide feedback on AI agent conversations.

## Data sharing

On Free and Pro, AI feedback sharing is opt-in per member. On Business, it is off by default and controlled by administrators. Recode never uses private codebase data to train foundation models.
