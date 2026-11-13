import fs from "node:fs";
import path from "node:path";
import { exec as cpExec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(cpExec);

export interface SupabaseConfig {
  projectRef?: string;
  accessToken?: string;
  apiUrl?: string;
}

export class SupabaseConnector {
  private token: string;
  private projectRef?: string;

  constructor(config: SupabaseConfig = {}) {
    this.token = config.accessToken || process.env.SUPABASE_ACCESS_TOKEN || "";
    this.projectRef = config.projectRef || process.env.SUPABASE_PROJECT_ID;
  }

  async generateTypes(workspaceDir: string, outputPath = "src/types/database.ts"): Promise<string> {
    const fullPath = path.resolve(workspaceDir, outputPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    if (!this.token || !this.projectRef) {
      throw new Error(
        "Supabase credentials missing: both SUPABASE_ACCESS_TOKEN and projectRef (or SUPABASE_PROJECT_ID) are required to generate live TypeScript types from your Supabase project."
      );
    }

    try {
      const { stdout } = await execAsync(
        `npx supabase gen types typescript --project-id "${this.projectRef}"`,
        {
          cwd: workspaceDir,
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: this.token },
        }
      );
      fs.writeFileSync(fullPath, stdout, "utf-8");
      return fullPath;
    } catch (err: any) {
      throw new Error(`Failed to generate Supabase TypeScript types: ${err.message}`);
    }
  }

  async applySqlMigration(sql: string, workspaceDir: string): Promise<{ success: boolean; message: string; filePath: string }> {
    const migrationDir = path.join(workspaceDir, "supabase", "migrations");
    fs.mkdirSync(migrationDir, { recursive: true });
    const filename = `${Date.now()}_recode_migration.sql`;
    const filePath = path.join(migrationDir, filename);
    fs.writeFileSync(filePath, sql, "utf-8");

    if (this.token && this.projectRef) {
      try {
        await execAsync(`npx supabase db push`, {
          cwd: workspaceDir,
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: this.token },
        });
        return {
          success: true,
          message: `Migration saved to ${path.relative(workspaceDir, filePath)} and successfully applied to Supabase project ${this.projectRef}.`,
          filePath,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Migration saved to ${path.relative(workspaceDir, filePath)}, but failed to apply to cloud database: ${err.message}.`,
          filePath,
        };
      }
    }

    return {
      success: true,
      message: `Migration saved locally to ${path.relative(workspaceDir, filePath)}. Note: Connect Supabase with access token to automatically push migrations to production.`,
      filePath,
    };
  }
}
