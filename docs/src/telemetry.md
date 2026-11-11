---
title: Telemetry
description: "What data Recode collects and how to control telemetry settings."
---

# Telemetry in Recode

Recode is built around local-first privacy. We collect minimal, anonymized telemetry strictly to understand stability patterns and diagnose engine crashes.

Telemetry falls into two categories:

- **Client-Side Diagnostics**: Optional anonymous crash reports and high-level feature usage metrics. You have full control to disable these completely in settings.
- **Server-Side Metrics**: Minimal token counters collected only when using Recode-hosted AI services for subscription metering. (Not applicable when using local Ollama or personal BYOK keys).

## Configuring Telemetry Settings

You have full control over what diagnostic data is sent out by Recode.
To disable all telemetry, open Settings (`Ctrl+,` or `Cmd+,`) and set telemetry to false:

```json [settings]
"telemetry": {
    "diagnostics": false,
    "metrics": false
}
```

## Types of Telemetry

### Diagnostics & Crash Reports

Crash reports consist of an anonymized minidump and debug metadata to help us identify and fix engine panics. Reports do not contain your project source code, file contents, or personal credentials.

### Client-Side Metrics

When metrics are enabled, Recode sends high-level operational counts, such as:
- File extensions of opened buffers (e.g., `.rs`, `.tsx`, `.py`)
- Editor features invoked (e.g., Command Palette, Terminal Dock)
- Detected build systems (e.g., Cargo, npm)

This data never includes your code or proprietary project logic.

### Local AI & BYOK Exemption

When you use local offline models via Ollama (`http://127.0.0.1:11434`) or provide your own API keys (BYOK), prompts and completions are strictly isolated to your workstation and the provider endpoint. Recode does not log, proxy, or collect your private prompts or completions.

## Recode Business Controls

Administrators on Recode Business can enforce org-wide policies disabling all telemetry across all managed developer workstations.

## Questions & Privacy Requests

If you have questions regarding telemetry or data handling, please contact our privacy engineering team:
- 📧 **Privacy & Telemetry:** [privacy@recode.dev](mailto:privacy@recode.dev)
- 🌐 **Privacy Policy:** [Recode Privacy Policy](../legal/privacy-policy.md)
