---
title: Subprocessor List
slug: subprocessors
---

Recode uses select third-party subprocessors to deliver core product functionality. Each subprocessor processes customer personal data only as necessary to provide its service, and all are subject to appropriate data protection agreements.

### How Recode Uses Subprocessors

To provide fast, reliable, and secure functionality, Recode relies on a small number of carefully vetted third-party subprocessors. These vendors help us deliver essential capabilities such as hosting, billing, analytics, real-time collaboration, and hosted AI features.

Each subprocessor only processes customer personal data as needed to provide its service.

Recode maintains contracts and data protection agreements with all subprocessors, including GDPR-compliant terms where applicable. We do not sell customer data, and we do not share customer personal data with vendors for advertising or marketing purposes.

### AI Subprocessors

Recode offers three modes for AI:

1. **Local AI / Offline** — runs 100% locally on your machine (e.g. via Ollama); zero data leaves your computer.
2. **Bring your own API key** — data goes directly from the customer to the model provider; Recode does not process or store it.
3. **External Agents** — Recode uses standard protocols to provide an enhanced experience with terminal-based AI code agents. Data is not processed or stored by Recode when using external agents.

### Ongoing Updates

**Last Updated**: November 2026

This subprocessor list is reviewed regularly. Recode will notify customers of material changes in accordance with our [Terms](https://recode.dev/terms) and [Privacy Policy](https://recode.dev/privacy-policy).

---

## Infrastructure & Hosting

| Subprocessor            | Purpose                                  | Data Location |
| ----------------------- | ---------------------------------------- | ------------- |
| **Cloudflare**          | Network services, Cloudflare Workers     | Global        |
| **Amazon Web Services** | Telemetry ingestion pipeline, S3 buckets | United States |
| **DigitalOcean**        | Application database hosting             | United States |
| **Vercel**              | Website and edge infrastructure hosting  | United States |

---

## Billing & Payments

| Subprocessor | Purpose                                                      | Data Location |
| ------------ | ------------------------------------------------------------ | ------------- |
| **Stripe**   | Payment processing                                           | United States |
| **Orb**      | Usage tracking, subscription management, and metered billing | United States |

---

## Operational Tools

| Subprocessor | Purpose                               | Data Location |
| ------------ | ------------------------------------- | ------------- |
| **Day.ai**   | Customer relationship management      | United States |
| **Linear**   | Issue tracking and project management | United States |

---

## Email & Communication

| Subprocessor   | Purpose                                                    | Data Location |
| -------------- | ---------------------------------------------------------- | ------------- |
| **ConvertKit** | Product update and feature announcement emails             | United States |
| **Loops**      | Email marketing and product communications                 | United States |
| **Plain**      | Consolidated platform for end-user support across channels | United States |

---

## Analytics & Data Processing

| Subprocessor         | Purpose                                                                                     | Data Location |
| -------------------- | ------------------------------------------------------------------------------------------- | ------------- |
| **Amplitude**        | Product analytics                                                                           | United States |
| **Axiom**            | Application telemetry, observability, and logs                                              | United States |
| **Fivetran**         | Automates data pipeline integration (extract, transformation, and load services) for Recode | United States |
| **Hex Technologies** | Analytics and debugging                                                                     | United States |
| **Snowflake**        | Data warehouse                                                                              | United States |

---

## Collaboration Services

| Subprocessor | Purpose                                                        | Data Location |
| ------------ | -------------------------------------------------------------- | ------------- |
| **LiveKit**  | Real-time audio/video and collaborative session infrastructure | United States |

---

## AI Services (Cloud Model Providers)

_These third-party API providers apply only when customers choose to use cloud AI models with their own keys. When users run local offline models (like Ollama), zero data passes through third-party infrastructure._

| Subprocessor        | Purpose                                                                                                                                                                                                          | Data Location |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **Anthropic**       | LLM completions for chat and code generation when Anthropic models are selected. Zero data retention agreements apply where available.                                                                           | United States |
| **Google (Vertex)** | LLM completions for chat and code generation when Gemini models are selected. Zero data retention agreements apply where available.                                                                             | United States |
| **OpenAI**          | LLM completions for chat and code generation when OpenAI models are selected. Zero data retention agreements apply where available.                                                                               | United States |
| **xAI**             | LLM completions for chat and code generation when xAI models are selected. Zero data retention agreements apply where available.                                                                                  | United States |
| **OpenRouter**      | Unified routing gateway for open-source and proprietary models when OpenRouter is selected.                                                                                                                      | United States |
