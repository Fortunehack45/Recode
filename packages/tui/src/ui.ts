import path from "node:path";
import { c } from "./colors.js";
import { AuthStatus } from "@recode/sdk";

export class UI {
  public static printBanner(version = "1.30.0"): void {
    const banner = `
${c.cyan(c.bold("  ____                     _      "))}
${c.cyan(c.bold(" |  _ \\ ___  ___ ___   __| | ___ "))}
${c.cyan(c.bold(" | |_) / _ \\/ __/ _ \\ / _` |/ _ \\"))}
${c.cyan(c.bold(" |  _ <  __/ (_| (_) | (_| |  __/"))}
${c.cyan(c.bold(" |_| \\_\\___|\\___\\___/ \\__,_|\\___|"))}  ${c.dim(`v${version}`)}
${c.dim(" Autonomous AI Software Engineering Terminal")}
`;
    console.log(banner);
  }

  public static printStatusBar(status: AuthStatus, workspaceDir: string, currentModel: string): void {
    const userBadge = status.github
      ? c.green(`✓ @${status.github.username}`)
      : c.yellow("! Unauthenticated");

    const relPath = path.basename(workspaceDir);
    const line = [
      `${c.bold("Workspace:")} ${c.cyan(relPath)}`,
      `${c.bold("Model:")} ${c.magenta(currentModel)}`,
      `${c.bold("Auth:")} ${userBadge}`,
    ].join(c.gray(" | "));

    console.log(` ${line}\n`);
  }

  public static printToolStart(toolName: string, args: Record<string, unknown>): void {
    let detail = "";
    if (args.path) detail = String(args.path);
    else if (args.command) detail = String(args.command);
    else if (args.query) detail = String(args.query);
    else if (args.pattern) detail = String(args.pattern);

    console.log(`\n${c.yellow(c.bold("⚙ [Tool]"))} ${c.bold(toolName)} ${detail ? c.dim(`(${detail})`) : ""}`);
  }

  public static printToolEnd(toolName: string, success: boolean, output: string, error?: string): void {
    if (success) {
      const lineCount = output.split("\n").length;
      console.log(`${c.green("  ✓")} ${c.dim(`Completed (${lineCount} lines output)`)}`);
    } else {
      console.log(`${c.red("  ✗ Failed:")} ${c.red(error || "Unknown error")}`);
      if (output) {
        console.log(c.dim(output.slice(0, 300)));
      }
    }
  }

  public static printHelp(): void {
    console.log(`
${c.bold("Available Slash Commands:")}
  ${c.cyan("/help")}             Show this help message
  ${c.cyan("/model <name>")}     Switch the active AI model (e.g. /model claude-3-7-sonnet)
  ${c.cyan("/models")}           List all available models and their status
  ${c.cyan("/auth")}             Check authentication status or login
  ${c.cyan("/auth login")}       Start GitHub Device Flow authentication
  ${c.cyan("/auth logout")}      Log out of GitHub
  ${c.cyan("/collab <room>")}    Join a real-time collaboration room on Fly.io
  ${c.cyan("/diff")}             Show git diff summary of current workspace
  ${c.cyan("/status")}           Show git status
  ${c.cyan("/clear")}            Clear current chat context and screen
  ${c.cyan("/exit")}             Exit Recode Terminal

${c.bold("Tips:")}
  - Type normal prompts like: "Find all usages of AuthStore and add unit tests"
  - Press ${c.bold("Ctrl+C")} at any time to interrupt the running agent
`);
  }
}
