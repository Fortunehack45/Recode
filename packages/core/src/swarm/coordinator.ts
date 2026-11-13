import { EventEmitter } from "node:events";
import { MessageBoard } from "./message_board.js";
import { SwarmRole, SwarmEvent, SwarmOptions, TaskSlice, TaskSliceStatus } from "./types.js";
import { SwarmWorker } from "./worker.js";
import { WorktreeManager } from "./worktree.js";
import { Tool } from "../tools/types.js";

export class SwarmCoordinator extends EventEmitter {
  private board: MessageBoard;
  private worktreeManager: WorktreeManager;
  private tasks: Map<string, TaskSlice> = new Map();
  private options: Required<SwarmOptions>;
  private customTools: Record<string, Tool> = {};

  constructor(options: SwarmOptions, customTools?: Record<string, Tool>) {
    super();
    this.options = {
      workspaceDir: options.workspaceDir,
      maxConcurrentWorkers: options.maxConcurrentWorkers || 3,
      useWorktrees: options.useWorktrees ?? false,
      model: options.model || "",
      signal: options.signal as any,
    };
    this.board = new MessageBoard();
    this.worktreeManager = new WorktreeManager(this.options.workspaceDir);
    if (customTools) {
      this.customTools = customTools;
    }

    this.board.on("message", (msg) => {
      this.emit("event", { type: "message_posted", message: msg } as SwarmEvent);
    });
  }

  getBoard(): MessageBoard {
    return this.board;
  }

  getTasks(): TaskSlice[] {
    return Array.from(this.tasks.values());
  }

  addTask(task: TaskSlice): void {
    this.tasks.set(task.id, { ...task, status: "pending" });
  }

  /**
   * Automatically decomposes a high-level user goal into a standard multi-agent execution DAG.
   */
  decomposeGoal(goal: string): TaskSlice[] {
    const isSocialApp = /social|feed|chat|post|media app/i.test(goal);
    const has3D = /3d|blender|unreal|game|mesh/i.test(goal);
    const hasVideo = /video|higgsfield|higesfild|cinematic|promo/i.test(goal);

    const slices: TaskSlice[] = [];

    // 1. Backend & Data Architecture
    slices.push({
      id: "task-backend",
      title: "Design Backend Architecture, Schema & Auth",
      description: `Establish database schemas, authentication flow, and REST/gRPC API contracts for: "${goal}". Publish contracts to the message board.`,
      assignedRole: "backend",
      dependencies: [],
      status: "pending",
      fileOwnership: ["src/server/**", "src/api/**", "src/db/**", "packages/backend/**"],
    });

    // 2. Algorithm / Core Logic (Concurrent with Backend if possible, or right after contract)
    if (isSocialApp || /algorithm|recommendation|rank/i.test(goal)) {
      slices.push({
        id: "task-algorithm",
        title: "Implement Core Recommendation & Ranking Algorithms",
        description: `Implement high-efficiency feed ranking, recommendation models, and search indexing for: "${goal}".`,
        assignedRole: "algorithm",
        dependencies: ["task-backend"],
        status: "pending",
        fileOwnership: ["src/algorithms/**", "src/lib/recommendation/**"],
      });
    }

    // 3. 3D Engine & Game Assets (Concurrent)
    if (has3D) {
      slices.push({
        id: "task-game-3d",
        title: "Generate 3D Meshes, Shaders & Engine Assets",
        description: `Create procedural 3D models and shaders via Blender and Unreal Engine 5 for: "${goal}". Export glTF/FBX assets.`,
        assignedRole: "game_3d",
        dependencies: [],
        status: "pending",
        fileOwnership: ["assets/3d/**", "public/models/**"],
      });
    }

    // 4. Generative Video & Media (Concurrent)
    if (hasVideo) {
      slices.push({
        id: "task-media",
        title: "Generate Cinematic Video Assets via Higgsfield AI",
        description: `Generate high-quality promotional video feeds and background motion graphics for: "${goal}".`,
        assignedRole: "media",
        dependencies: [],
        status: "pending",
        fileOwnership: ["public/videos/**", "assets/media/**"],
      });
    }

    // 5. Frontend UI/UX (Consumes Backend + Media + 3D)
    const frontendDeps = ["task-backend"];
    if (has3D) frontendDeps.push("task-game-3d");
    if (hasVideo) frontendDeps.push("task-media");

    slices.push({
      id: "task-frontend",
      title: "Build Responsive UI & Reactive Application Shell",
      description: `Build reactive frontend components, mobile-responsive layout, and interactive state management for: "${goal}".`,
      assignedRole: "frontend",
      dependencies: frontendDeps,
      status: "pending",
      fileOwnership: ["src/components/**", "src/pages/**", "src/app/**", "public/**"],
    });

    // 6. Cloud & Deployment (Supabase + Vercel)
    slices.push({
      id: "task-devops",
      title: "Provision Supabase Database & Deploy Production to Vercel",
      description: `Run Supabase SQL migrations with RLS policies, configure environment variables, and trigger zero-context Vercel production deployment.`,
      assignedRole: "devops",
      dependencies: ["task-frontend"],
      status: "pending",
      fileOwnership: ["supabase/**", "vercel.json", ".env*"],
    });

    // 7. QA & Verification
    slices.push({
      id: "task-qa",
      title: "Execute Automated Tests & End-to-End Verification",
      description: `Write and execute comprehensive unit/integration test suites, verify compiler invariants, and ensure zero regressions.`,
      assignedRole: "qa",
      dependencies: ["task-devops"],
      status: "pending",
      fileOwnership: ["tests/**", "**/*.test.*"],
    });

    for (const s of slices) {
      this.addTask(s);
    }

    return slices;
  }

  async runSwarm(goal?: string): Promise<{ success: boolean; completedTasks: number; totalTasks: number }> {
    if (goal && this.tasks.size === 0) {
      this.decomposeGoal(goal);
    }

    this.emit("event", { type: "swarm_started", details: goal || "Executing task slices" } as SwarmEvent);

    const inFlight = new Set<string>();
    let hasFailure = false;

    while (true) {
      const pendingTasks = Array.from(this.tasks.values()).filter((t) => t.status === "pending");
      const inProgressTasks = Array.from(this.tasks.values()).filter((t) => t.status === "in_progress");

      // Check if all tasks are complete
      if (pendingTasks.length === 0 && inProgressTasks.length === 0) {
        break;
      }

      // Find ready tasks whose dependencies are all completed
      const readyTasks = pendingTasks.filter((t) => {
        return t.dependencies.every((depId) => {
          const dep = this.tasks.get(depId);
          return dep && dep.status === "completed";
        });
      });

      // If no tasks are ready and nothing is running, we have a deadlock or failure
      if (readyTasks.length === 0 && inProgressTasks.length === 0) {
        hasFailure = true;
        break;
      }

      // Launch tasks up to maxConcurrentWorkers limit
      const slotsAvailable = this.options.maxConcurrentWorkers - inFlight.size;
      const tasksToLaunch = readyTasks.slice(0, Math.max(0, slotsAvailable));

      for (const task of tasksToLaunch) {
        task.status = "in_progress";
        inFlight.add(task.id);
        this.emit("event", { type: "task_started", taskId: task.id, role: task.assignedRole } as SwarmEvent);

        // Run worker asynchronously
        (async () => {
          let workspaceDir = this.options.workspaceDir;
          if (this.options.useWorktrees) {
            workspaceDir = await this.worktreeManager.createWorktree(task.assignedRole);
          }

          const worker = new SwarmWorker({
            role: task.assignedRole,
            workspaceDir,
            board: this.board,
            customTools: this.customTools,
            model: this.options.model,
            signal: this.options.signal,
          });

          const result = await worker.executeTask(task);

          if (result.success) {
            task.status = "completed";
            task.resultSummary = result.output;
            this.emit("event", { type: "task_completed", taskId: task.id, role: task.assignedRole } as SwarmEvent);
            if (this.options.useWorktrees) {
              await this.worktreeManager.removeWorktree(task.assignedRole, true);
            }
          } else {
            task.status = "failed";
            task.error = result.output;
            this.emit("event", { type: "task_failed", taskId: task.id, role: task.assignedRole, details: result.output } as SwarmEvent);
            hasFailure = true;
          }

          inFlight.delete(task.id);
        })();
      }

      // Wait a tick before evaluating again
      await new Promise((res) => setTimeout(res, 50));
    }

    const totalTasks = this.tasks.size;
    const completedTasks = Array.from(this.tasks.values()).filter((t) => t.status === "completed").length;

    this.emit("event", {
      type: "swarm_completed",
      details: `Completed ${completedTasks}/${totalTasks} tasks`,
    } as SwarmEvent);

    return {
      success: !hasFailure && completedTasks === totalTasks,
      completedTasks,
      totalTasks,
    };
  }
}
