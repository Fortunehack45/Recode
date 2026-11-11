---
title: Privacy Policy
slug: privacy-policy
---

# Recode Privacy Policy

**Effective Date**: November 12, 2026  
**Last Updated**: November 2026  
**Entity**: Recode Technologies Inc. ("Recode", "we", "us", or "our")

Recode is engineered around local-first privacy. We believe your source code, architectural designs, proprietary algorithms, and trade secrets should remain strictly on your physical hardware under your control.

This Privacy Policy explains what limited data Recode collects, how it is handled, and your rights under global privacy regulations, including the European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA/CPRA).

---

## 1. Local-First Engineering Architecture

1. **Air-Gapped & Local Operations**: Recode executes text editing, buffer management, syntax parsing, and workspace indexation entirely on your local machine. No file buffers, ASTs, or workspace tokens are automatically mirrored to Recode cloud servers.
2. **Local AI Model Privacy**: When using offline AI engines (such as local Ollama on `http://127.0.0.1:11434`), 100% of the token processing, completions, context windows, and tool execution take place strictly on your local CPU and GPU.
3. **Customer Code Exemption**: Recode never uses customer private code, repository trees, or commit logs to train foundation machine learning models.

---

## 2. Information We Collect

### A. Client-Side Telemetry & Crash Diagnostics (Optional & User-Controlled)
By default, you have complete control over editor telemetry. If enabled in Settings (`"telemetry": { "diagnostics": true, "metrics": true }`), Recode collects:
- Anonymized crash minidumps and stack traces for engine crash isolation.
- OS version, GPU hardware family, and display scale factors.
- Editor feature usage frequencies (e.g., command palette invocations, theme switching).

*You can disable all diagnostic and metric telemetry at any time by toggling them to `false` in your settings file.*

### B. Account & Subscription Data (Hosted Services Only)
When you create a Recode account or purchase a Recode Pro or Recode Business subscription:
- We collect your name, email address, company affiliation, and transaction billing identifiers.
- Payment processing is handled securely by certified third-party payment processors (e.g., Stripe); Recode does not store raw credit card numbers.

### C. Bring Your Own Key (BYOK) Inference
When you configure your own external provider API keys (Anthropic, OpenAI, Google Gemini):
- API keys are stored locally on your machine in encrypted platform keychains or local configuration.
- Prompt transmissions occur directly between your local workstation and the third-party provider's API endpoints. Recode does not act as a man-in-the-middle proxy for your private BYOK traffic.

---

## 3. Lawful Bases for Processing (GDPR Articles 6 & 13)

We process limited personal data under the following lawful bases:
- **Contractual Necessity**: To provide licensed software services, manage active user seats, and fulfill subscription agreements.
- **Legitimate Interest**: To monitor crash occurrences, detect software regressions, prevent fraud, and ensure network security.
- **Consent**: For optional telemetry reporting, voluntary feedback submissions, and marketing communications (which may be withdrawn at any time).

---

## 4. Subprocessors & Third-Party Service Providers

Recode partners with vetted enterprise service providers for crash reporting, cloud infrastructure, and transaction processing. For a comprehensive, up-to-date registry of all authorized subprocessors and their jurisdictional locations, see [Recode Authorized Subprocessors](./subprocessors.md).

---

## 5. Your Data Rights (GDPR & CCPA/CPRA)

Regardless of your geographic location, Recode honors the following privacy rights:
- **Right to Access & Portability**: Request a copy of any personal telemetry or account data we maintain in a portable format.
- **Right to Rectification**: Correct inaccuracies in your profile or billing records.
- **Right to Erasure ("Right to be Forgotten")**: Request permanent deletion of your account and associated diagnostic logs.
- **Right to Opt-Out**: We **do not sell or share** your personal information or codebase data with data brokers or advertising networks.

---

## 6. Security & Encryption Standards

Recode implements industry-standard technical and organizational security measures, including TLS 1.3 encryption in transit for all network calls, authenticated access controls, and regular static analysis and vulnerability audits.

---

## 7. Contact the Data Protection Officer (DPO)

For privacy inquiries, GDPR/CCPA data requests, or compliance verifications, contact our Privacy Team:
- **Privacy Officer**: [privacy@recode.dev](mailto:privacy@recode.dev)
- **Legal Compliance**: [legal@recode.dev](mailto:legal@recode.dev)
- **Security Team**: [security@recode.dev](mailto:security@recode.dev)
- **Headquarters**: Recode Technologies Inc., 1209 Orange Street, Wilmington, DE 19801, USA
