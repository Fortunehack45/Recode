import { SupabaseConnector } from "../connectors/cloud/supabase.js";
import { VercelConnector } from "../connectors/cloud/vercel.js";
import { Tool, ToolContext, ToolResult } from "./types.js";

const supabase = new SupabaseConnector();
const vercel = new VercelConnector();

export const supabaseGenerateTypesTool: Tool = {
  definition: {
    name: "supabase_generate_types",
    description: "Generate type-safe TypeScript interfaces from Supabase database schema into project src/types/database.ts.",
    parameters: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Target file path (default: src/types/database.ts)" },
      },
    },
  },
  async execute(args: { outputPath?: string }, context: ToolContext): Promise<ToolResult> {
    try {
      const generatedFile = await supabase.generateTypes(context.workspaceDir, args.outputPath);
      return { success: true, output: `Generated Supabase TypeScript types at ${generatedFile}` };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const supabaseApplyMigrationTool: Tool = {
  definition: {
    name: "supabase_apply_migration",
    description: "Apply a PostgreSQL schema migration with Row-Level Security (RLS) policies to Supabase.",
    parameters: {
      type: "object",
      properties: {
        sql: { type: "string", description: "SQL migration commands to apply (CREATE TABLE, ALTER TABLE, CREATE POLICY, etc.)" },
      },
      required: ["sql"],
    },
  },
  async execute(args: { sql: string }, context: ToolContext): Promise<ToolResult> {
    try {
      const result = await supabase.applySqlMigration(args.sql, context.workspaceDir);
      return { success: true, output: result.message };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};

export const vercelDeployTool: Tool = {
  definition: {
    name: "vercel_deploy_project",
    description: "Deploy current web application to Vercel and stream production HTTPS URL.",
    parameters: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "Vercel project name" },
        prod: { type: "boolean", description: "Whether to deploy to production (default: true)" },
      },
    },
  },
  async execute(args: { projectName?: string; prod?: boolean }, context: ToolContext): Promise<ToolResult> {
    try {
      const result = await vercel.deploy(context.workspaceDir, {
        projectName: args.projectName,
        prod: args.prod !== false,
      });

      if (!result.success) {
        return { success: false, output: "", error: result.logs };
      }

      return {
        success: true,
        output: `Successfully deployed to Vercel: ${result.url}\n${result.logs || ""}`,
      };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};
