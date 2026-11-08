# Recode Database Schema & Supabase Specification

## Overview

The Recode collaboration backend (`crates/collab`) utilizes a relational schema hosted on **Supabase PostgreSQL** (PostgreSQL 15+). The schema powers real-time channel communication, multi-user CRDT document synchronization, permissions, and WebRTC room coordination.

---

## Connection Configuration

Supabase provides two connection strings:
1. **Transaction Pooler (Recommended for Collab)**:
   - `postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - Optimized for high-frequency concurrent worker connections.
2. **Direct Session Connection**:
   - `postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Suitable for running schema migrations or administrative tasks.

---

## Core Entities & Tables

### 1. `users`
Represents synchronized users in the system.
- `id`: `BIGINT PRIMARY KEY` (maps to GitHub user ID or generated integer ID).
- `admin`: `BOOLEAN NOT NULL DEFAULT false` (indicates administrative privileges).
- `connected_once`: `BOOLEAN NOT NULL DEFAULT false` (first-time connection tracker).

### 2. `channels`
Represents collaborative workspaces and chat channels.
- `id`: `SERIAL PRIMARY KEY`
- `name`: `VARCHAR NOT NULL`
- `visibility`: `VARCHAR NOT NULL DEFAULT 'public'` ('public', 'private')
- `parent_path`: `TEXT` (hierarchical channel organization)

### 3. `channel_members`
Permissions and user associations within channels.
- `channel_id`: `INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE`
- `user_id`: `INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `role`: `VARCHAR NOT NULL` ('admin', 'member', 'guest')
- `PRIMARY KEY (channel_id, user_id)`

### 4. `rooms` & `room_participants`
Active audio/video/screen-sharing rooms coordinated with LiveKit.
- `rooms.id`: `SERIAL PRIMARY KEY`
- `rooms.livekit_room`: `VARCHAR NOT NULL` (unique LiveKit room identifier)
- `room_participants.room_id`: `INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE`
- `room_participants.user_id`: `INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `room_participants.role`: `VARCHAR NOT NULL`
- `room_participants.answering_user_id`: `INTEGER`

### 5. `projects` & `project_collaborators`
Shared multi-user editor sessions.
- `projects.id`: `SERIAL PRIMARY KEY`
- `projects.room_id`: `INTEGER REFERENCES rooms(id)`
- `projects.host_user_id`: `INTEGER NOT NULL REFERENCES users(id)`
- `project_collaborators.project_id`: `INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
- `project_collaborators.user_id`: `INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`

### 6. `buffers`, `buffer_operations`, & `buffer_snapshots`
Real-time CRDT text synchronization storage.
- `buffers.id`: `SERIAL PRIMARY KEY`
- `buffers.channel_id`: `INTEGER NOT NULL REFERENCES channels(id)`
- `buffers.epoch`: `INTEGER NOT NULL DEFAULT 0`
- `buffer_operations.buffer_id`: `INTEGER NOT NULL REFERENCES buffers(id)`
- `buffer_operations.epoch`: `INTEGER NOT NULL`
- `buffer_operations.replica_id`: `INTEGER NOT NULL`
- `buffer_operations.lamport_timestamp`: `INTEGER NOT NULL`
- `buffer_operations.value`: `BYTEA NOT NULL` (serialized CRDT delta)
- `buffer_snapshots.buffer_id`: `INTEGER NOT NULL REFERENCES buffers(id)`
- `buffer_snapshots.epoch`: `INTEGER NOT NULL`
- `buffer_snapshots.text`: `TEXT NOT NULL`

---

## Migration Management

Migrations are defined using SeaORM in `crates/collab/migrations`.
- Applied automatically during server startup via `setup_app_database(config)`.
- Can be executed manually in development via:
  ```bash
  cargo run --package collab --bin collab -- migrate
  ```
