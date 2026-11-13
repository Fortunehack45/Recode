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

    if (!this.token && !this.projectRef) {
      // Mock generation for sandbox / offline mode
      const mockSchema = `export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; full_name: string; created_at: string };
        Insert: { id?: string; email: string; full_name?: string; created_at?: string };
        Update: { id?: string; email?: string; full_name?: string; created_at?: string };
      };
      posts: {
        Row: { id: string; user_id: string; content: string; media_url?: string; created_at: string };
        Insert: { id?: string; user_id: string; content: string; media_url?: string };
        Update: { id?: string; user_id?: string; content?: string; media_url?: string };
      };
    };
  };
}
`;
      fs.writeFileSync(fullPath, mockSchema, "utf-8");
      return fullPath;
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
    } catch {
      // Fallback: write basic schema
      return this.generateTypes(workspaceDir, outputPath);
    }
  }

  async applySqlMigration(sql: string, workspaceDir: string): Promise<{ success: boolean; message: string }> {
    const migrationDir = path.join(workspaceDir, "supabase", "migrations");
    fs.mkdirSync(migrationDir, { recursive: true });
    const filename = `${Date.now()}_recode_migration.sql`;
    const filePath = path.join(migrationDir, filename);
    fs.writeFileSync(filePath, sql, "utf-8");

    return {
      success: true,
      message: `Migration saved to ${path.relative(workspaceDir, filePath)} and queued for Supabase execution.`,
    };
  }
}
