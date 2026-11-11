---
title: Plans & Pricing
description: Compare Recode's Free, Pro, and Business plans, and understand token-based usage metering, spend limits, and trial details.
---

# Plans & Pricing

For costs and more information on pricing, visit [Recode's pricing page](https://recode.dev/pricing).

Recode works without AI features or a subscription. No [authentication](../authentication.md) is required for the editor itself.

## Plans {#plans}

|                                                          | Free | Pro       | Student   | Business  |
| -------------------------------------------------------- | ---- | --------- | --------- | --------- |
| Recode-hosted AI models                                  | —    | ✓         | ✓         | ✓         |
| [AI via own API keys](../ai/use-api-access.md)           | ✓    | ✓         | ✓         | ✓         |
| [External Agents](../ai/external-agents.md)              | ✓    | ✓         | ✓         | ✓         |
| Edit Predictions                                         | —    | Unlimited | Unlimited | Unlimited |
| [Org-wide admin controls](../business/admin-controls.md) | —    | —         | —         | ✓         |
| Roles & permissions                                      | —    | —         | —         | ✓         |
| Consolidated billing                                     | —    | —         | —         | ✓         |

### Recode Free {#free}

Recode is free to use. You can configure AI agents with your own API keys via [Use API Access](../ai/use-api-access.md) or run local offline models with Ollama without any subscription. Recode's hosted cloud models and [Edit Predictions](../ai/edit-prediction.md) require a Pro subscription. You can still use edit predictions from [other providers](../ai/edit-prediction.md#other-providers), like GitHub Copilot or a local model.

### Recode Pro {#pro}

Recode Pro includes access to all hosted AI models and Edit Predictions. The plan includes $5 of monthly token credit; usage beyond that is billed at the rates listed on [Recode-Hosted Models](./recode-hosted-models.md). A [trial of Recode Pro](#trials) includes $5 of GPT-6 Luna usage and unlimited Edit Predictions for 14 days from when you start the trial.

For details on billing and payment, see [Individual Billing](./billing.md).

### Recode Business {#business}

Recode Business gives members with a paid Business seat access to all of Recode's hosted AI models, unlimited Edit Predictions, plus org-wide controls for administrators: which AI features are available, what data leaves your organization, and how AI spend is tracked. Paid seats and AI usage are consolidated into a single invoice.

For a full feature overview, see [Recode Business](../business/overview.md). For billing details, see [Billing](./billing.md#organization).

### Recode Student {#student}

The [Recode Student plan](https://recode.dev/education) includes unlimited [Edit Predictions](../ai/edit-prediction.md), $10/month in token credits, and all [hosted AI models](./recode-hosted-models.md) except Claude Fable, Claude Opus, GPT-6 Astra, GPT-5.5 pro, and GPT-5.4 pro. The plan is available free for one year to verified university students.

## Usage {#usage}

Usage of Recode's hosted models is measured on a token basis, converted to dollars at the rates listed on [Recode-Hosted Models](./recode-hosted-models.md) (list price from the provider, +10%).

Monthly included credit resets on your monthly billing date. To view your current usage, navigate to the Billing page at [dashboard.recode.dev](https://dashboard.recode.dev).

## Spend Limits {#usage-spend-limits}

### Recode Pro {#pro-spend-limits}

On your Billing page you'll find an input for `Monthly Spend Limit`. For Recode Pro, the dollar amount here specifies your pre-tax _monthly_ limit for spend on tokens, _not counting_ the $5/month included with your Pro subscription.

The default value for Pro users is $10, for a total monthly spend with Recode of $20 ($10 for your Pro subscription, $10 in incremental token spend). This can be set to $0 to limit your spend with Recode to exactly $10/month.

Once the spend limit is hit, we'll stop any further usage until your token spend limit resets.

### Recode Business {#business-spend-limits}

On Recode Business, administrators set a pre-tax org-wide spend limit from the Data & Privacy page in the organization dashboard. Seats and AI usage are consolidated into [Organization billing](./billing.md#organization). Once the org-wide spend limit is reached, we'll stop hosted model usage for members until the limit resets or an administrator raises it.

> **Note:** Spend limits are a Recode Pro and Business feature. Student plan users cannot configure spend limits; usage is capped at the $10/month included credit.
