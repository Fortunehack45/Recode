---
name: non-ai-engineering
description: Production software engineering framework for eliminating AI code smells and textbook boilerplate. Enforces battle-tested architectures across application design, frontend, backend, databases, and cybersecurity, banning naive happy-path code, redundant comments, and fragile abstractions.
---

# Non-AI Engineering & Battle-Tested Systems Standard

This skill establishes the strict production-engineering standard for Recode AI. It systematically eliminates **AI code smells**, textbook boilerplate, and naive happy-path implementations across **Application Design**, **Frontend**, **Backend**, **Databases**, and **Cybersecurity**.

---

## 1. The Anatomy of AI Code Smells

AI coding models default to patterns that compile in unit tests but collapse under real-world production load:

| Domain | The AI-Generated Slop (BANNED) | The Battle-Tested Production Standard (MANDATORY) |
|---|---|---|
| **App Design** | Monolithic God classes; empty `// TODO: implement here`; generic factory patterns for single implementations; dummy mocks; missing OS lifecycle handlers. | **Layered clean architecture**: Unidirectional data flow, explicit error boundaries, OS signal traps (`SIGINT`/`SIGTERM`), native window chrome, thread-safe memory models. |
| **Frontend** | `useEffect` state-sync spaghetti; unmemoized closures causing re-render storms; unhandled error states; layout thrashing (interleaved DOM reads/writes); `any` types. | **Deterministic state machines**: Optimistic updates with rollback, virtualized lists for large datasets, batch DOM measurements, strict runtime schema validation (Zod). |
| **Backend** | Single-file script endpoints; missing graceful shutdown drains; unbounded goroutines/threads; missing circuit breakers; swallow-all `catch (e) {}` blocks. | **Resilient distributed microservices**: Context propagation, connection pool sizing, idempotency keys, distributed rate limiting, transactional outbox pattern. |
| **Database** | Unbounded `SELECT *`; naive `OFFSET 10000` pagination; missing composite index for sorted queries; raw string interpolation; unhandled deadlock retries. | **Keyset cursor pagination** (`WHERE id > :cursor`); compound indexes matching query planner; strict foreign keys; zero-downtime expand/contract schema migrations. |
| **Cybersecurity** | Storing JWTs in `localStorage`; `==` comparison of hashes (timing attacks); weak password hashing (plain SHA-256); missing IDOR/tenant ownership checks. | **Constant-time comparisons** (`hmac.compare_digest`); `HttpOnly, Secure, SameSite=Strict` cookies; Argon2id KDF; defense-in-depth tenant boundary verification. |

---

## 2. Application Design & Architecture: Anti-AI Principles

### 1. Banishing the "Explaining Comment" Anti-Pattern
Never generate comments that merely narrate what the next line of code does:
```typescript
// ❌ AI CODE SMELL: Redundant comment bloat
// Set user loading state to true
setIsLoading(true);
// Fetch user profile from the API
const user = await api.getUser();
// Set user loading state to false
setIsLoading(false);

// ✅ PRODUCTION CLEAN CODE: Self-documenting code with explicit error handling
setIsLoading(true);
try {
  const user = await api.getUser();
  setProfile(user);
} catch (error) {
  reportTelemetry(error);
  notifyUser('Failed to load profile. Check your connection.');
} finally {
  setIsLoading(false);
}
```

### 2. Eliminating Generic Over-Engineering
Never create generic factories, abstract adapters, or deep inheritance trees for types that only have one implementation. Prefer plain functions and composable traits/interfaces.

---

## 3. Frontend Engineering: Anti-AI Hardening

### 1. Eliminating `useEffect` Race Conditions & Dependency Lies
AI code frequently writes naive `useEffect` fetchers that suffer from race conditions when dependencies change quickly:

```typescript
// ❌ AI CODE SMELL: Out-of-order responses overwrite newer requests!
useEffect(() => {
  fetch(`/api/search?q=${query}`).then(res => res.json()).then(setData);
}, [query]);

// ✅ PRODUCTION STANDARD: AbortController with cleanup
useEffect(() => {
  const controller = new AbortController();
  
  async function executeSearch() {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setData(data);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Search failed');
      }
    }
  }

  executeSearch();
  return () => controller.abort(); // Cancel in-flight request if query changes
}, [query]);
```

---

## 4. Backend Systems: Graceful Drains & Idempotency

### 1. Zero-Downtime Graceful Shutdown
Never let an application kill active client connections instantly on SIGTERM:

```go
// ✅ PRODUCTION GO: Graceful HTTP Server Teardown
func runServer(ctx context.Context, srv *http.Server) error {
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	<-shutdownChan
	log.Println("Shutting down server gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	return srv.Shutdown(shutdownCtx) // Allows in-flight requests 15s to complete
}
```

### 2. Idempotency Key Pattern for Mutating Operations
AI-generated payment or order endpoints regularly double-charge on client retries. Always check and store idempotency tokens:

```sql
-- Idempotency store pattern in PostgreSQL
CREATE TABLE public.idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  response_code INT NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

---

## 5. Database Query Engineering: Anti-AI Patterns

### 1. Banning `OFFSET` Pagination for Large Datasets
`OFFSET 10000` forces the database engine to scan 10,000 rows off disk and throw them away. Always use **Keyset Cursor Pagination**:

```sql
-- ❌ AI CODE SMELL: Terrible O(N) performance on large tables
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50 OFFSET 50000;

-- ✅ PRODUCTION KEYSET CURSOR: Instant O(log N) B-Tree seek
SELECT id, event_type, created_at, payload
FROM audit_logs
WHERE (created_at, id) < (:last_seen_created_at, :last_seen_id)
ORDER BY created_at DESC, id DESC
LIMIT 50;
```

### 2. Compound Index Ordering Math
Indexes must match the exact query predicates:
- Equality columns first: `WHERE tenant_id = '...'`
- Inequality / Range columns second: `AND status IN ('pending', 'running')`
- Sort columns last: `ORDER BY created_at DESC`
$$\implies \text{CREATE INDEX ON tasks (tenant_id, status, created_at DESC);}$$

---

## 6. Cybersecurity Engineering: Anti-AI Invariants

### 1. Timing-Attack Immune Comparisons
```python
import hmac

# ❌ AI CODE SMELL: Leaks character match duration via early return
# if user_hash == expected_hash: ...

# ✅ PRODUCTION STANDARD: Fixed constant-time bitwise comparison
if not hmac.compare_digest(user_hash.encode('utf-8'), expected_hash.encode('utf-8')):
    raise SecurityException("Invalid signature")
```

### 2. SSRF DNS Rebinding Defense
AI code regularly writes `requests.get(url)` for user-supplied URLs. Always resolve IP, verify against private/link-local CIDRs, and pin the socket directly:

```python
import ipaddress, socket
from urllib.parse import urlparse

def validate_outbound_url(target_url: str):
    parsed = urlparse(target_url)
    if parsed.scheme not in ('http', 'https'):
        raise ValueError("Disallowed scheme")
    
    # Resolve all IPs
    ip_strings = socket.gethostbyname_ex(parsed.hostname)[2]
    for ip_str in ip_strings:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise SecurityException(f"SSRF blocked: Attempted request to private IP {ip_str}")
```

---

## 7. Non-AI Engineering Checklist

- [ ] **No Dead Code / TODO Placeholders**: Code is 100% complete, runnable, and drop-in ready.
- [ ] **No Redundant Comments**: Explanations reserved for non-obvious algorithmic invariants or workarounds.
- [ ] **Connection Pooling Math**: Max DB connections = `(core_count * 2) + disk_spindle_count`.
- [ ] **Keyset Pagination**: No unbounded `OFFSET` queries across tables $> 1,000$ rows.
- [ ] **Graceful Signals**: System handles `SIGTERM` and `SIGINT` cleanly without dropping in-flight tasks.
- [ ] **Zero Trust Input Validation**: Every network payload parsed through strict schemas (Zod/Pydantic/Protobuf).
