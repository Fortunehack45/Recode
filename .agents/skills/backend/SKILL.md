---
name: backend
description: Master-level distributed backend systems engineering. Covers horizontal scalability, database sharding/partitioning, distributed caching patterns (Cache-Aside, Write-Through), gRPC/Protobuf contracts, message queues (Kafka, RabbitMQ), and high-availability consensus.
---

# Distributed Backend Systems & Cloud Architecture

This skill provides exhaustive guidance on architecting high-throughput, horizontally scalable, fault-tolerant backend services and distributed data systems.

---

## 1. High-Availability & Distributed Consensus (CAP & PACELC)

### PACELC Theorem
In a partitioned system (P), trade off **Availability (A)** vs **Consistency (C)**; else (E), trade off **Latency (L)** vs **Consistency (C)**:
- **PC/EC (e.g., Spanner, CockroachDB)**: Chooses consistency on partitions and consistency during normal operation at the cost of higher round-trip latency.
- **PA/EL (e.g., Cassandra, DynamoDB)**: Chooses availability on partitions and lowest latency during normal operation via eventual consistency.

### Consensus Protocols (Raft & Multi-Paxos)
Raft guarantees safety across terms through:
1. **Leader Election**: Randomized election timers ($150-300\text{ms}$) to prevent split-vote scenarios.
2. **Log Replication**: Leaders only commit entries once acknowledged by a strict majority of nodes ($\lfloor N/2 \rfloor + 1$).
3. **State Machine Safety**: An entry committed in a given term will be present in the logs of the leaders for all higher terms.

---

## 2. Distributed Caching Strategies & Thundering Herd Defense

### Cache-Aside with Probabilistic Early Expiration (XFetch)
Standard TTL causes a thundering herd when a popular key expires simultaneously for thousands of concurrent queries. Use the **XFetch algorithm** to recompute values asynchronously before expiration:

$$\Delta t - \beta \cdot \delta \cdot \ln(\text{random}()) \le 0$$

Where:
- $\Delta t$: Remaining time to expiration ($TTL - (now - created)$).
- $\delta$: Time taken to compute the value from the database.
- $\beta > 0$: Aggressiveness parameter (default $1.0$).
- $\text{random}() \sim \mathcal{U}(0, 1)$.

```python
import time, math, random

def should_refresh_early(expires_at: float, compute_time: float, beta: float = 1.0) -> bool:
    time_left = expires_at - time.time()
    if time_left <= 0:
        return True
    # As time_left decreases, the probability of returning True approaches 1
    return (time_left - (beta * compute_time * math.log(random.random()))) <= 0
```

---

## 3. High-Throughput gRPC & Protocol Buffers Architecture

Protocol Buffers offer $10\times$ faster serialization and $3-5\times$ smaller payloads than JSON:

```protobuf
syntax = "proto3";

package recode.backend.v1;

option go_package = "github.com/recode/backend/v1;backendv1";

service WorkspaceStreamService {
  rpc SyncBuffers(stream BufferUpdateRequest) returns (stream BufferUpdateResponse);
  rpc GetWorkspaceSnapshot(WorkspaceSnapshotRequest) returns (WorkspaceSnapshotResponse);
}

message BufferUpdateRequest {
  string buffer_id = 1;
  uint64 revision = 2;
  bytes delta_compressed = 3;
  int64 client_timestamp_utc = 4;
}

message BufferUpdateResponse {
  string buffer_id = 1;
  uint64 server_revision = 2;
  bool applied = 3;
}
```

---

## 4. Backend Engineering Checklist

- [ ] **Idempotency Keys**: Enforce unique idempotency keys (`Idempotency-Key` header) on all financial and mutating endpoints.
- [ ] **Circuit Breakers**: Wrap downstream HTTP/gRPC dependencies with circuit breakers (e.g., trip after 50% failures over 10s; reset after 30s cool-down).
- [ ] **Distributed Tracing**: Propagate W3C Trace Context (`traceparent` headers) across all microservice boundaries.
- [ ] **Graceful Drain**: Intercept `SIGTERM`, stop accepting new connections on the listener, allow active requests 15s to finish, and close pools.
