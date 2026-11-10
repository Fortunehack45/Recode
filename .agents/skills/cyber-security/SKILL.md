---
name: cyber-security
description: Production offensive and defensive cybersecurity engineering. Covers threat modeling, OWASP Top 10 (2025/2026), Zero Trust architecture, cryptographic primitives, memory safety, JWT/session hardening, timing attacks, and DevSecOps SAST/DAST audits.
---

# Cybersecurity & Application Security Engineering

This skill provides exhaustive guidance on engineering attack-resilient systems, identifying vulnerabilities, implementing Zero Trust access models, and verifying cryptographic primitives.

---

## 1. Threat Modeling & Zero Trust Architecture

### STRIDE Threat Modeling Framework
Every architectural component must be evaluated against the six STRIDE vectors:
- **Spoofing**: Impersonating a user or process. Mitigate via Mutual TLS (mTLS), strict FIDO2/WebAuthn, and cryptographically signed JWTs with `alg: "ES256"` or `"EdDSA"`.
- **Tampering**: Modifying data in transit or rest. Mitigate via HMAC-SHA256, authenticated encryption (AES-256-GCM / ChaCha20-Poly1305), and immutable audit ledgers.
- **Repudiation**: Denying performed actions. Mitigate via signed, append-only, centralized audit logs with NTP-synchronized UTC timestamps and correlation IDs.
- **Information Disclosure**: Unauthorized exposure of sensitive data. Mitigate via envelope encryption, field-level masking, strict Row-Level Security, and memory zeroization.
- **Denial of Service**: Resource exhaustion. Mitigate via token-bucket rate limiting, reverse-proxy circuit breakers, connection pooling limits, and strict payload size ceilings.
- **Elevation of Privilege**: Gaining unauthorized capabilities. Mitigate via Principle of Least Privilege (PoLP), RBAC/ABAC policy enforcement engines (OPA/Cedar), and strict perimeter checks.

---

## 2. Cryptographic Implementation Standards

### Symmetric & Asymmetric Encryption
- **Data at Rest**: AES-256-GCM or ChaCha20-Poly1305. Never use ECB mode. Always ensure nonces (IVs) are cryptographically random and **never reused** with the same key.
- **Key Derivation (KDF)**:
  - User Passwords: **Argon2id** ($m=64\,\text{MB}, t=3, p=4$) or **scrypt**. Never use plain SHA-256, MD5, or standard bcrypt for high-security targets without salting.
  - Subkey Derivation: **HKDF** (RFC 5869) with SHA-256/SHA-512.
- **Asymmetric Signatures**: **Ed25519** (EdDSA) or **ECDSA** over P-256. Avoid RSA with keys $< 3072$ bits.

### Constant-Time Comparisons (Timing Attack Immunity)
Never compare cryptographic hashes, signatures, or authentication tokens using standard string equality (`===` or `==`). Standard equality exits early on the first mismatched byte, leaking secret timing profiles to remote attackers:

```python
import hmac

# VULNERABLE: Leaks timing information byte-by-byte
# if user_token == server_token: ...

# IMMUNE: Constant-time comparison
def verify_token_constant_time(received: bytes, expected: bytes) -> bool:
    return hmac.compare_digest(received, expected)
```

---

## 3. OWASP Top 10 Hardening & Mitigation Code

### 1. Injection (SQL, Command, LDAP)
Always use parameterized queries and structured abstractions. Never concatenate user input:

```typescript
// SECURE: Parameterized SQL (PostgreSQL example)
import { sql } from 'slonik';

async function findUserByEmail(pool: DatabasePool, email: string) {
  return await pool.maybeOne(sql.type(UserSchema)`
    SELECT id, email, role, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1;
  `);
}
```

### 2. Broken Authentication & Session Hijacking
- **JWT Hardening**:
  - Always enforce explicit algorithm whitelist in verification: `algorithms: ['ES256']`. Reject tokens with `alg: "none"`.
  - Validate `exp`, `nbf`, `iss` (issuer), and `aud` (audience).
  - Store tokens in `__Host-` prefixed `HttpOnly`, `Secure`, `SameSite=Strict` cookies. Never store JWTs in `localStorage`.
- **Session Revocation**: Maintain a Redis-backed token revocation denylist with TTL matching token expiry to invalidate tokens upon logout or privilege escalation.

### 3. Server-Side Request Forgery (SSRF)
When fetching remote URLs provided by users:
- Resolve DNS and inspect resolved IP addresses before establishing the socket.
- Reject private/reserved IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` cloud metadata).
- Disable automatic redirect following or re-verify target IP on every hop.

---

## 4. Cybersecurity Audit Checklist

- [ ] **Content-Security-Policy (CSP)**: `default-src 'self'; script-src 'self' 'nonce-...'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`.
- [ ] **Security Headers**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] **Rate Limiting**: Distributed token-bucket or sliding-window rate limit applied to authentication endpoints (e.g., maximum 5 attempts per minute per IP/account).
- [ ] **Sensitive Data Scrubbing**: Ensure tokens, API keys, passwords, and PII are redacted from application logs, error traces, and APM spans.
- [ ] **Secret Scanning**: Verify `.env`, private keys (`.pem`, `.key`), and credentials are listed in `.gitignore` and audited with tools like `gitleaks`.
