import fs from "node:fs";
import path from "node:path";
import { exec as cpExec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(cpExec);

export class WorktreeManager {
  private baseDir: string;
  private worktreeRoot: string;
  private activeWorktrees: Map<string, string> = new Map();

  constructor(baseDir: string) {
    this.baseDir = path.resolve(baseDir);
    this.worktreeRoot = path.join(this.baseDir, ".recode", "worktrees");
  }

  async isGitRepo(): Promise<boolean> {
    try {
      const { stdout } = await execAsync("git rev-parse --is-inside-work-tree", { cwd: this.baseDir });
      return stdout.trim() === "true";
    } catch {
      return false;
    }
  }

  async createWorktree(roleId: string): Promise<string> {
    const isGit = await this.isGitRepo();
    if (!isGit) {
      // Non-git fallback: return main directory
      return this.baseDir;
    }

    const targetDir = path.join(this.worktreeRoot, roleId);
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });

    if (fs.existsSync(targetDir)) {
      this.activeWorktrees.set(roleId, targetDir);
      return targetDir;
    }

    try {
      const branchName = `recode-swarm-${roleId}-${Date.now().toString(36)}`;
      await execAsync(`git worktree add -B "${branchName}" "${targetDir}" HEAD`, { cwd: this.baseDir });
      this.activeWorktrees.set(roleId, targetDir);
      return targetDir;
    } catch {
      // If worktree command fails, fallback safely to baseDir
      return this.baseDir;
    }
  }

  async removeWorktree(roleId: string, mergeIntoMain = false): Promise<void> {
    const targetDir = this.activeWorktrees.get(roleId);
    if (!targetDir || targetDir === this.baseDir) return;

    try {
      if (mergeIntoMain) {
        // Commit changes inside worktree
        await execAsync(`git add -A && git commit -m "feat(swarm): changes from ${roleId} worker"`, { cwd: targetDir }).catch(() => {});
      }
      await execAsync(`git worktree remove --force "${targetDir}"`, { cwd: this.baseDir });
    } catch {
      // Clean up directory if git command failed
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
    } finally {
      this.activeWorktrees.delete(roleId);
    }
  }

  async cleanAll(): Promise<void> {
    for (const roleId of Array.from(this.activeWorktrees.keys())) {
      await this.removeWorktree(roleId, false);
    }
  }
}
