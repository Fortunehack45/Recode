# Recode Collaboration Architecture

## 1. System Topology

Recode collaboration is designed as a hybrid client-server and peer-coordinated architecture. It separates control plane operations, document state synchronization, and high-bandwidth WebRTC audio/video streaming into distinct, specialized tiers:

```mermaid
flowchart TD
    ClientA[Recode Client A] <-->|WSS RPC (CRDT & Control)| CollabServer[Recode Collab Server (Fly.io)]
    ClientB[Recode Client B] <-->|WSS RPC (CRDT & Control)| CollabServer
    CollabServer <-->|SQL / Pooler| Supabase[(Supabase PostgreSQL)]
    CollabServer -->|JWT Room Token| ClientA
    CollabServer -->|JWT Room Token| ClientB
    ClientA <==>|WebRTC Audio/Video/Screen| LiveKit[LiveKit SFU Mesh]
    ClientB <==>|WebRTC Audio/Video/Screen| LiveKit
```

---

## 2. Core Architectural Components

### A. Recode Desktop Client
- **Crates**: `crates/client`, `crates/collab_ui`, `crates/project`, `crates/audio`.
- **Responsibilities**:
  - Maintains local CRDT edit history and Lamport clocks.
  - Manages peer cursor positions, selections, and active participant roster.
  - Renders audio/call controls, screen share views, and collaboration panel.
  - Transmits binary RPC messages over persistent TLS WebSockets (`wss://recode-collab.fly.dev/rpc`).

### B. Collab Server (`crates/collab`)
- **Hosting**: Fly.io Machines (Northern Virginia `iad`).
- **Framework**: Rust, Axum, Tokio, SeaORM.
- **Responsibilities**:
  - Authenticates WebSocket connection handshakes using GitHub access tokens.
  - Manages real-time room rosters, channel membership, and presence broadcasts.
  - Dispatches serialized CRDT buffer operations between collaborating clients.
  - Generates scoped, signed JWT access tokens for LiveKit WebRTC rooms.
  - Writes periodic document snapshots and channel metadata to Supabase PostgreSQL.

### C. Supabase PostgreSQL
- **Hosting**: Supabase Cloud (AWS `us-east-1`).
- **Responsibilities**:
  - Persists channels, memberships, permission roles, user profiles, and channel buffer history.
  - High availability with connection pooling (PgBouncer) on port 6543.

### D. LiveKit SFU (Selective Forwarding Unit)
- **Hosting**: LiveKit Cloud.
- **Responsibilities**:
  - Handles ultra-low latency WebRTC audio mixing, microphone volume normalization, and screen share forwarding.
  - Desktop client connects directly to LiveKit endpoints using cryptographically signed room tokens issued by the Recode Collab server.

---

## 3. Communication Protocols

### Authentication Flow
1. **GitHub Device Flow**: Client receives user authorization token from GitHub (`https://github.com/login/device`).
2. **WebSocket Handshake**: Client initiates WebSocket to `wss://recode-collab.fly.dev/rpc` with header:
   ```http
   Authorization: <user_id> <github_access_token>
   ```
3. **Validation**: Collab server queries `https://api.github.com/user` to verify token authenticity, extract user metadata, and upsert record in Supabase.
4. **Session Establishment**: Server creates connection epoch and registers client in memory.

### CRDT Document Synchronization
- Documents use conflict-free replicated data types.
- Edits generate atomic operations with `(epoch, replica_id, lamport_timestamp, byte_delta)`.
- The collab server broadcasts deltas to all participants in the shared project.
- In the event of network disruption, clients exchange vector clocks upon reconnection to reconcile divergent edits without data loss.

### Voice & Video Calls
1. User clicks **Join Call** in a channel or project.
2. Client sends `rpc::JoinRoom` message to collab server.
3. Collab server mints a LiveKit token containing `room_name`, `identity`, and media permissions (`can_publish`, `can_subscribe`).
4. Client connects native WebRTC transport directly to LiveKit edge servers.
