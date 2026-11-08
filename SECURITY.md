# Security Policy

## Reporting Security Issues

We take the security of Recode seriously. If you believe you have discovered a vulnerability or security flaw, please report it responsibly so that we can address it before public disclosure.

### How to Report
- **Preferred Method**: Open a Private Vulnerability Report on GitHub under the **Security** tab of [https://github.com/Fortunehack45/Recode](https://github.com/Fortunehack45/Recode).
- **Alternative Method**: Email the maintainers directly at `security@recode.dev` (or open a confidential inquiry).

Please include:
- A description of the issue and potential impact.
- Step-by-step reproduction steps or a minimal proof-of-concept.
- Affected platforms (Windows, macOS, Linux) and Recode version.

### Response Timeline
- **Initial Acknowledgment**: Within 48 hours of receipt.
- **Triage & Assessment**: Within 5 business days.
- **Fix & Public Advisory**: Coordinated release with CVE assignment where appropriate.

---

## Supported Versions

Only the latest release channel builds are supported with security updates.

| Release Channel | Supported |
| :--- | :--- |
| Latest Stable Release | ✅ Yes |
| Preview Channel | ✅ Yes |
| Older Releases | ❌ No (please upgrade to latest) |

---

## Security Architecture & Design Principles

Recode is architected to minimize attack surface and preserve user privacy:

1. **Bring Your Own Key (BYOK) Isolation**:
   - Provider API keys (Anthropic, OpenAI, Google Gemini, OpenRouter, etc.) are stored exclusively in your operating system's native keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service / Keyring).
   - API keys are transmitted directly to the upstream model provider over TLS. They never pass through Recode intermediary servers.

2. **Zero Telemetry & Tracking**:
   - Recode does not transmit diagnostic telemetry, telemetry events, keylogger logs, or user analytics.

3. **Standalone Extension Sandbox**:
   - Extensions run out-of-process in isolated WebAssembly or subprocess host runtimes with controlled capability access.

4. **Self-Hosted Collaboration**:
   - Real-time multiplayer synchronization operates over authenticated WebSockets and WebRTC with no persistent message archiving on untrusted relays.
