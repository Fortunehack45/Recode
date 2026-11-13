export type SwarmRole =
  | "coordinator"
  | "backend"
  | "frontend"
  | "algorithm"
  | "game_3d"
  | "media"
  | "devops"
  | "qa";

export type TaskSliceStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "completed"
  | "failed";

export interface TaskSlice {
  id: string;
  title: string;
  description: string;
  assignedRole: SwarmRole;
  dependencies: string[];
  status: TaskSliceStatus;
  fileOwnership: string[];
  resultSummary?: string;
  error?: string;
}

export type SwarmMessageType =
  | "brief"
  | "contract"
  | "update"
  | "blocker"
  | "complete";

export interface SwarmMessage {
  id: string;
  timestamp: number;
  senderRole: SwarmRole;
  recipientRole?: SwarmRole | "broadcast";
  type: SwarmMessageType;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface SwarmEvent {
  type:
    | "swarm_started"
    | "task_started"
    | "task_completed"
    | "task_failed"
    | "message_posted"
    | "contract_published"
    | "swarm_completed";
  taskId?: string;
  role?: SwarmRole;
  message?: SwarmMessage;
  details?: string;
}

export interface SwarmOptions {
  workspaceDir: string;
  maxConcurrentWorkers?: number;
  useWorktrees?: boolean;
  model?: string;
  signal?: AbortSignal;
}
