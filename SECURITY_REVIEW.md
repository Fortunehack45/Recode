# Recode Comprehensive Security Review & Threat Model

## 1. Executive Summary

This security review evaluates the architecture, credential handling, network posture, and backend services of **Recode**. By eliminating hosted middleman servers, telemetry collection, and centralized credential escrow, Recode drastically shrinks the common attack surfaces associated with modern cloud-connected code editors.

---

## 2. Threat Analysis & Mitigations

### Threat A: Exposure of AI Provider API Keys
- **Risk**: User keys (Anthropic, OpenAI, Gemini) intercepted or extracted from disk.
- **Mitigation**:
  - Keys are never stored in plaintext configuration files (`settings.json`).
  - Stored exclusively in native hardware-backed operating system keychains:
    - **Windows**: Windows Credential Manager via Windows DPAPI (`CryptProtectData`).
    - **macOS**: Apple Keychain Services with application-isolated ACLs.
    - **Linux**: FreeDesktop Secret Service API / GNOME Keyring / KWallet over DBus.
  - Outbound requests travel directly over TLS to the upstream provider (`api.anthropic.com`, etc.). No intermediary proxy receives the key.

### Threat B: Man-in-the-Middle (MitM) & Network Interception
- **Risk**: Interception of code buffers or collaboration streams on public Wi-Fi.
- **Mitigation**:
  - Strict TLS 1.3 enforcement on all outbound HTTPS, WebSocket (`wss://`), and WebRTC connections.
  - Certificate validation backed by native OS root certificate stores.

### Threat C: Malicious Extensions & Code Execution
- **Risk**: Untrusted extension code compromising user environment.
- **Mitigation**:
  - Extensions run out-of-process in WebAssembly (Wasmtime) sandbox environments or isolated Language Server Protocol subprocesses.
  - Extensions have no direct access to editor memory or host file systems beyond explicit workspace boundaries.

### Threat D: SQL Injection & Backend Data Tampering
- **Risk**: Attackers exploiting collaboration RPC queries to exfiltrate database records.
- **Mitigation**:
  - `crates/collab` utilizes **SeaORM** with strongly typed query builders and 100% parameterized SQL statements. No dynamic SQL string concatenation is permitted.
  - Database access is restricted to least-privilege service roles on Supabase PostgreSQL.

### Threat E: Unauthorized Collaboration & Eavesdropping
- **Risk**: Uninvited users joining private channels or tapping voice streams.
- **Mitigation**:
  - LiveKit WebRTC room access requires cryptographically signed JWT tokens minted dynamically by the collab server using HMAC-SHA256. Tokens are short-lived (10 minutes) and scoped to specific room IDs and user identities.
  - WebSocket RPC connections validate user identity via GitHub OAuth token verification on every initial handshake.

---

## 3. Supply Chain & Dependency Hygiene

- **Audited Crates**: 1,319 workspace dependencies scanned.
- **Zero AGPL**: No viral copyleft dependencies in the shipping binary.
- **Automated Verification**: Dependencies audited with `cargo-deny` and `cargo-audit` in GitHub Actions CI workflows.
