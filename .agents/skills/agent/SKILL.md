---
name: agent
description: Autonomous Multi-Agent Swarm Orchestration and execution engineering. Triggered by /agent to switch Recode into Agent Mode. Empowers the AI to autonomously decompose high-level initiatives, spawn parallel subagents (Backend, Frontend, Algorithms, 3D, Media, DevOps, QA), manage shared contracts, and orchestrate end-to-end full-stack projects without manual hand-holding.
---

# Recode Autonomous Multi-Agent Swarm Mode (`/agent`)

This skill defines the autonomous multi-agent swarm architecture. Invoking `/agent` transitions Recode from **Normal Mode** (interactive single-agent assistant) into **Agent Mode** (autonomous hierarchical multi-agent orchestrator).

---

## 1. Operating Mode Distinction

| Mode | Trigger | Execution Paradigm | Context Scope | Concurrency |
| :--- | :---: | :--- | :--- | :---: |
| **Normal Mode** *(Default)* | Default / `/normal` | Single-turn assistant, precise surgical edits, conversational feedback | Current active file & workspace | Serial (1 turn at a time) |
| **Agent Mode** | `/agent` | Autonomous project decomposition, contract negotiation, multi-agent spawning | Full repository, external 3D/Cloud APIs | Parallel Swarm (up to 10 workers) |

---

## 2. Autonomous Task Decomposition Protocol

When `/agent <goal>` is invoked (e.g. `"/agent build a multiplayer social media & 3D virtual world app"`):

1. **Lead Coordinator Phase**:
   - Decomposes the initiative into a Directed Acyclic Graph (DAG) of non-overlapping `TaskSlice`s.
   - Assigns explicit file-ownership boundaries to avoid write collisions.
2. **Concurrent Specialized Worker Execution**:
   - **Backend Architect**: Designs PostgreSQL schemas, REST/gRPC endpoints, and Supabase RLS policies.
   - **Frontend Engineer**: Constructs reactive, accessible UI components and state machines.
   - **Algorithm Specialist**: Implements recommendation feeds, search ranking, and O(n) data structures.
   - **3D & Game Engine Specialist**: Uses Blender and Unreal Engine 5 to generate procedural meshes, materials, and level actors.
   - **Media Producer**: Prompts Higgsfield AI to generate cinematic video assets and animations.
   - **DevOps Specialist**: Applies database migrations and executes 1-click Vercel production deployments.
   - **QA Auditor**: Continuously runs verification gates (`pnpm test`, `cargo check`) to prevent regressions.
3. **Contract-First Communication**:
   - All inter-agent dependencies are negotiated via the **Message Board** (`packages/core/src/swarm/message_board.ts`).
   - Shared interfaces (TypeScript types, OpenAPI, Protobuf) are published *before* dependent code generation begins.

---

## 3. Toolset & Bridge Capabilities in Agent Mode

In Agent Mode, the agent has full access to external studio and cloud bridges:
- **3D Studio**: `blender_execute_python`, `blender_create_mesh`, `blender_export_asset`, `unreal_execute_python`, `unreal_spawn_actor`.
- **Media Studio**: `media_generate_video`, `media_camera_motion`.
- **Cloud & Database**: `supabase_apply_migration`, `supabase_generate_types`, `vercel_deploy_project`.
- **Swarm Blackboard**: `board_post`, `board_read`.

---

## 4. Verification & Convergence Gate

An autonomous swarm run is only complete when:
1. All task slices in the DAG report `completed`.
2. Workspace builds cleanly (`pnpm -r run build` / `cargo check`).
3. Automated test suites pass with zero regressions.
4. Production release or live preview URL is reported back to the user.
