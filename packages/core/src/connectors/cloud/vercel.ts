import { exec as cpExec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(cpExec);

export interface VercelDeployOptions {
  projectName?: string;
  prod?: boolean;
  env?: Record<string, string>;
}

export class VercelConnector {
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.VERCEL_TOKEN || "";
  }

  async deploy(workspaceDir: string, options: VercelDeployOptions = {}): Promise<{ success: boolean; url: string; logs?: string }> {
    const prodFlag = options.prod !== false ? "--prod" : "";

    if (!this.token) {
      return {
        success: false,
        url: "",
        logs: "Vercel authentication required: VERCEL_TOKEN environment variable or access token must be provided. Connect Vercel via Settings -> MCP Servers or export VERCEL_TOKEN.",
      };
    }

    try {
      const { stdout } = await execAsync(`npx -y vercel deploy ${prodFlag} --yes --token="${this.token}"`, {
        cwd: workspaceDir,
        env: { ...process.env, ...options.env },
      });

      const lines = stdout.trim().split("\n");
      const url = lines[lines.length - 1].trim();
      return { success: true, url, logs: stdout };
    } catch (err: any) {
      return { success: false, url: "", logs: err.message };
    }
  }
}
