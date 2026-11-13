import { Agent } from "../agent/loop.js";
import { Tool } from "../tools/types.js";
import { MessageBoard } from "./message_board.js";
import { SwarmRole, TaskSlice } from "./types.js";

const ROLE_SYSTEM_PROMPTS: Record<SwarmRole, string> = {
  coordinator: `You are the Lead Swarm Coordinator. Your responsibility is to decompose high-level user initiatives into discrete, non-conflicting task slices with explicit dependency ordering, file ownership boundaries, and architectural contracts.`,

  backend: `You are the Backend Architect Specialist. You design database schemas, REST/gRPC endpoints, ORM models, authentication middleware, and robust server logic. Publish schemas and endpoint definitions to the message board early so frontend and algorithmic agents can rely on concrete contracts.`,

  frontend: `You are the Frontend & UI/UX Specialist. You build accessible, responsive, high-performance web/mobile user interfaces with modern state management, CSS layouts, and component architectures. Inspect the message board for backend contracts before consuming API endpoints.`,

  algorithm: `You are the Core Algorithms & Data Specialist. You design feed recommendation systems, search ranking heuristics, graph traversals, and computational data pipelines with strict mathematical efficiency (O(log n), O(n)).`,

  game_3d: `You are the 3D Design & Game Engine Specialist. You use Blender and Unreal Engine 5 to generate procedural meshes, PBR shaders, level actors, and physics configurations, exporting standardized glTF, FBX, and USD assets directly into the project.`,

  media: `You are the Generative Media Producer. You leverage Higgsfield AI and video generation pipelines to produce cinematic promotional videos, UI background motion graphics, and animated assets, embedding them seamlessly into the web/game codebase.`,

  devops: `You are the Cloud & Release Specialist. You configure Supabase PostgreSQL migrations, Row-Level Security (RLS) policies, and execute 1-click Vercel cloud production deployments with zero-downtime secret synchronization.`,

  qa: `You are the Verification & Quality Assurance Auditor. You write exhaustive unit and integration test suites, check compiler invariants, verify accessibility, and guarantee zero regressions.`,
};

export interface WorkerOptions {
  role: SwarmRole;
  workspaceDir: string;
  board: MessageBoard;
  customTools?: Record<string, Tool>;
  model?: string;
  signal?: AbortSignal;
}

export class SwarmWorker {
  public readonly role: SwarmRole;
  private agent: Agent;
  private board: MessageBoard;
  private workspaceDir: string;

  constructor(options: WorkerOptions) {
    this.role = options.role;
    this.board = options.board;
    this.workspaceDir = options.workspaceDir;

    const systemPrompt = ROLE_SYSTEM_PROMPTS[this.role] || ROLE_SYSTEM_PROMPTS.backend;

    this.agent = new Agent({
      workspaceDir: this.workspaceDir,
      model: options.model,
      systemPrompt,
      customTools: options.customTools,
      signal: options.signal,
    });
  }

  async executeTask(task: TaskSlice): Promise<{ success: boolean; output: string }> {
    this.board.post(
      this.role,
      "update",
      `Starting task [${task.id}]: ${task.title}`,
      "coordinator",
      { taskId: task.id }
    );

    const contracts = this.board.allContracts();
    const contractsSummary = Object.keys(contracts).length > 0
      ? `\nActive Shared Contracts:\n${JSON.stringify(contracts, null, 2)}`
      : "";

    const prompt = `Task Assignment: [${task.id}] ${task.title}
Role: ${this.role}
Task Description: ${task.description}
File Boundaries: ${task.fileOwnership.join(", ") || "All files in workspace"}${contractsSummary}

Complete this task slice rigorously. If you create API contracts or schemas, explicitly note them in your output.`;

    let finalOutput = "";
    try {
      for await (const event of this.agent.prompt(prompt)) {
        if (event.type === "turn_complete" && event.content) {
          finalOutput = event.content;
        }
      }

      this.board.post(
        this.role,
        "complete",
        `Task completed [${task.id}]: ${task.title}`,
        "coordinator",
        { taskId: task.id, summary: finalOutput }
      );

      return { success: true, output: finalOutput };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      this.board.post(
        this.role,
        "blocker",
        `Task failed [${task.id}]: ${errorMsg}`,
        "coordinator",
        { taskId: task.id, error: errorMsg }
      );
      return { success: false, output: errorMsg };
    }
  }
}
