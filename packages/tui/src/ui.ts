import path from "node:path";
import { c } from "./colors.js";
import { AuthStatus, ModelInfo } from "@recode/sdk";

export class UI {
  public static printBanner(version = "1.30.0"): void {
    console.log(`\n  ${c.cyan(c.bold("RECODE TERMINAL"))} ${c.dim(`v${version}`)} ${c.gray("•")} ${c.dim("Autonomous AI Coding Agent")}`);
  }

  /**
   * Main OpenCode-inspired boxed header in Recode styling.
   */
  public static printHeader(
    status: AuthStatus,
    workspaceDir: string,
    currentModel: string,
    version = "1.30.0"
  ): void {
    const relPath = path.basename(workspaceDir) || workspaceDir;
    const userBadge = status.github
      ? c.green(`✓ @${status.github.username}`)
      : c.yellow("! Not connected (run /login)");

    const modelDisplay = currentModel === "(unconfigured)"
      ? c.yellow("! None configured (run /connect)")
      : c.cyan(c.bold(currentModel));

    const w = 68;
    const border = "─".repeat(w - 2);

    console.log();
    console.log(c.cyan(`╭${border}╮`));
    console.log(c.cyan("│") + `  ${c.bold("RECODE TERMINAL")} ${c.dim(`v${version}`)} ${c.gray("•")} ${c.dim("Autonomous AI Coding Agent")}`.padEnd(w + 14) + c.cyan("│"));
    console.log(c.cyan("│") + " ".repeat(w - 2) + c.cyan("│"));
    console.log(c.cyan("│") + `  ${c.bold("📁 Workspace:")}  ${c.white(relPath)}`.padEnd(w + 14) + c.cyan("│"));
    console.log(c.cyan("│") + `  ${c.bold("⚡ Active Model:")} ${modelDisplay}`.padEnd(w + 22) + c.cyan("│"));
    console.log(c.cyan("│") + `  ${c.bold("🔒 GitHub:")}      ${userBadge}`.padEnd(w + 22) + c.cyan("│"));
    console.log(c.cyan(`╰${border}╯`));
    console.log(`  ${c.dim("Shortcuts:")} ${c.cyan("/connect")} ${c.dim("·")} ${c.cyan("/models")} ${c.dim("·")} ${c.cyan("/login")} ${c.dim("·")} ${c.cyan("/collab")} ${c.dim("·")} ${c.cyan("/help")} ${c.dim("·")} ${c.cyan("/exit")}\n`);
  }

  /**
   * OpenCode-style onboarding / provider connect card.
   */
  public static printConnectMenu(): void {
    const w = 72;
    const border = "─".repeat(w - 2);

    console.log(c.yellow(`╭${border}╮`));
    console.log(c.yellow("│") + `  ${c.bold("Connect an AI Provider (BYOK)")}`.padEnd(w + 7) + c.yellow("│"));
    console.log(c.yellow("│") + `  ${c.dim("Recode supports any major AI provider. Connect your preferred key:")}`.padEnd(w + 14) + c.yellow("│"));
    console.log(c.yellow("│") + " ".repeat(w - 2) + c.yellow("│"));
    console.log(c.yellow("│") + `  1. ${c.bold("Google Gemini")}  ${c.cyan("/connect gemini <key>")}    ${c.dim("(Generous free tier, 1M context)")}`.padEnd(w + 22) + c.yellow("│"));
    console.log(c.yellow("│") + `  2. ${c.bold("OpenAI")}         ${c.cyan("/connect openai <key>")}    ${c.dim("(GPT-4o, o3-mini)")}`.padEnd(w + 22) + c.yellow("│"));
    console.log(c.yellow("│") + `  3. ${c.bold("Anthropic")}      ${c.cyan("/connect anthropic <key>")} ${c.dim("(Claude 3.7 / 3.5 Sonnet)")}`.padEnd(w + 22) + c.yellow("│"));
    console.log(c.yellow("│") + `  4. ${c.bold("DeepSeek")}       ${c.cyan("/connect deepseek <key>")}  ${c.dim("(DeepSeek V3, DeepSeek R1)")}`.padEnd(w + 22) + c.yellow("│"));
    console.log(c.yellow("│") + `  5. ${c.bold("Groq")}           ${c.cyan("/connect groq <key>")}      ${c.dim("(Llama 3.3 70B - ultra fast)")}`.padEnd(w + 22) + c.yellow("│"));
    console.log(c.yellow("│") + `  6. ${c.bold("Local Ollama")}   ${c.cyan("/model ollama-local")}      ${c.dim("(100% Free & offline local AI)")}`.padEnd(w + 22) + c.yellow("│"));
    console.log(c.yellow("│") + " ".repeat(w - 2) + c.yellow("│"));
    console.log(c.yellow("│") + `  ${c.dim("Or run interactive picker by simply typing:")} ${c.cyan(c.bold("/connect"))}`.padEnd(w + 20) + c.yellow("│"));
    console.log(c.yellow(`╰${border}╯\n`));
  }

  /**
   * Device Authorization Card for GitHub OAuth Device Flow.
   */
  public static printDeviceAuthCard(userCode: string, verificationUri: string): void {
    const w = 70;
    const border = "─".repeat(w - 2);

    console.log(`\n` + c.cyan(`╭${border}╮`));
    console.log(c.cyan("│") + `  ${c.bold("GitHub Device Authorization (Zero Email / Single Click)")}`.padEnd(w + 7) + c.cyan("│"));
    console.log(c.cyan("│") + " ".repeat(w - 2) + c.cyan("│"));
    console.log(c.cyan("│") + `  1. Verification URL : ${c.underline(verificationUri)}`.padEnd(w + 14) + c.cyan("│"));
    console.log(c.cyan("│") + `  2. One-Time Code    : ${c.bold(c.green(userCode))}  ${c.dim("(Copied to clipboard!)")}`.padEnd(w + 22) + c.cyan("│"));
    console.log(c.cyan("│") + " ".repeat(w - 2) + c.cyan("│"));
    console.log(c.cyan("│") + `  ${c.dim("Waiting for authorization in your browser...")}`.padEnd(w + 9) + c.cyan("│"));
    console.log(c.cyan(`╰${border}╯\n`));
  }

  public static printDeviceAuthSuccess(username: string): void {
    console.log(c.green(`✓ Successfully connected as @${username}!\n`));
  }

  /**
   * Tool execution cards.
   */
  public static printToolStart(toolName: string, args: Record<string, unknown>): void {
    let detail = "";
    if (args.path) detail = String(args.path);
    else if (args.command) detail = String(args.command);
    else if (args.query) detail = String(args.query);
    else if (args.pattern) detail = String(args.pattern);

    console.log(`\n` + c.yellow(`╭─ ⚙ Tool: ${c.bold(toolName)} ${detail ? c.dim(`(${detail})`) : ""}`));
  }

  public static printToolEnd(toolName: string, success: boolean, output: string, error?: string): void {
    if (success) {
      const lineCount = output.split("\n").length;
      console.log(c.green(`│  ✓ Completed (${lineCount} lines output)`) + `\n` + c.yellow(`╰──────────────────────────────────────────`));
    } else {
      console.log(c.red(`│  ✗ Failed: ${error || "Unknown error"}`));
      if (output) {
        console.log(c.dim(`│  ${output.slice(0, 200).replace(/\n/g, "\n│  ")}`));
      }
      console.log(c.yellow(`╰──────────────────────────────────────────`));
    }
  }

  /**
   * Models browser table.
   */
  public static printModels(models: Record<string, ModelInfo>, activeModelId: string): void {
    console.log(`\n${c.bold("Available Recode Models:")}\n`);
    for (const [key, m] of Object.entries(models)) {
      const active = key === activeModelId || m.id === activeModelId;
      const badge = active ? c.green(c.bold("● [Active] ")) : "  ";
      console.log(`${badge}${c.cyan(c.bold(key.padEnd(20)))} ${c.bold(m.name)}`);
      console.log(`    ${c.dim("Provider:")} ${m.provider} | ${c.dim("Context:")} ${m.contextWindow.toLocaleString()} tokens`);
      console.log(`    ${c.dim(m.description)}\n`);
    }
    console.log(`  ${c.dim("Switch active model:")} ${c.cyan("/model <id>")} ${c.dim("(e.g. /model gemini-2.5-flash)")}\n`);
  }

  /**
   * Help screen.
   */
  public static printHelp(): void {
    console.log(`
${c.bold("Recode Terminal Commands:")}

  ${c.bold("AI Models & Providers:")}
    ${c.cyan("/connect [provider] [key]")}   Connect an API key (or run without args for picker)
    ${c.cyan("/models")}                     Browse all available models and their status
    ${c.cyan("/model <name>")}               Switch active model (e.g. /model gemini-2.5-flash)

  ${c.bold("GitHub & Collaboration:")}
    ${c.cyan("/login")}                      Connect GitHub account via Device Flow (No email!)
    ${c.cyan("/logout")}                     Disconnect GitHub account
    ${c.cyan("/auth")}                       Check authentication & API key status
    ${c.cyan("/collab [room]")}              Connect to live multiplayer room on Fly.io

  ${c.bold("Workspace & Tools:")}
    ${c.cyan("/diff")}                       Show git diff summary of current workspace
    ${c.cyan("/status")}                     Show git status
    ${c.cyan("/clear")}                      Clear screen and session history
    ${c.cyan("/exit")}                       Quit Recode Terminal

  ${c.bold("Pro Tips:")}
    • All commands work with or without leading '/' (e.g. ${c.cyan("models")}, ${c.cyan("login")}, ${c.cyan("connect")})
    • Prefixing with ${c.cyan("recode")} or ${c.cyan(".\\recode")} also works!
    • Enter prompts naturally: "Read packages/core and explain how auth works"
    • Press ${c.bold("Ctrl+C")} at any time to cancel streaming
`);
  }
}
