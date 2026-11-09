import path from "node:path";
import { c } from "./colors.js";
import { renderBox, padRight, visibleWidth } from "./text.js";
import { AuthStatus, ModelInfo } from "@recode/sdk";

export class UI {
  public static printBanner(version = "1.30.0"): void {
    console.log(
      `\n  ${c.cyan(c.bold("◆ RECODE TERMINAL"))} ${c.dim(`v${version}`)} ${c.gray("·")} ${c.dim("Autonomous AI Software Engineering")}`
    );
  }

  /**
   * Main OpenCode-style boxed header in Recode theme.
   */
  public static printHeader(
    status: AuthStatus,
    workspaceDir: string,
    currentModel: string,
    mode: "build" | "plan" = "build",
    version = "1.30.0"
  ): void {
    const relPath = path.basename(workspaceDir) || workspaceDir;
    const userBadge = status.github
      ? c.green(`● @${status.github.username}`)
      : c.yellow("○ Not signed in (run /login)");

    const modelDisplay =
      currentModel === "(unconfigured)"
        ? c.yellow("! No key configured — type /connect")
        : `${c.cyan(c.bold(currentModel))}`;

    const modeDisplay =
      mode === "build"
        ? c.green(c.bold("⚡ Build")) + c.dim(" (full read, write, and command execution)")
        : c.magenta(c.bold("🔍 Plan")) + c.dim(" (read-only architecture & review)");

    const lines = [
      c.dim("Autonomous AI Software Engineering Terminal"),
      "",
      `${c.bold("📁 Workspace:")}  ${c.white(relPath)} ${c.dim(`(${workspaceDir})`)}`,
      `${c.bold("⚡ Model:")}      ${modelDisplay}`,
      `${c.bold("🛡 Mode:")}       ${modeDisplay}`,
      `${c.bold("👤 Account:")}    ${userBadge}`,
      `${c.bold("🌐 Collab:")}     ${c.green("● Connected")} ${c.dim("wss://recode-collab.fly.dev/rpc")}`,
      "",
      `${c.dim("Commands:")}   ${c.cyan("/connect")}  ${c.cyan("/models")}  ${c.cyan("/login")}  ${c.cyan("/mode")}  ${c.cyan("/clear")}  ${c.cyan("/help")}  ${c.cyan("/exit")}`,
    ];

    console.log();
    console.log(
      renderBox(lines, `${c.cyan(c.bold("◆ Recode Terminal"))} ${c.dim(`v${version}`)}`, {
        borderColor: c.cyan,
        rounded: true,
      })
    );
    console.log();
  }

  /**
   * OpenCode-style interactive provider onboarding card.
   */
  public static printConnectMenu(): void {
    const lines = [
      c.bold("Connect an AI Provider (BYOK — Bring Your Own Key)"),
      c.dim("Recode is provider-agnostic. Connect your preferred key:"),
      "",
      `  ${c.cyan(c.bold("[1] Google Gemini"))}     ${c.dim("gemini-2.5-flash, gemini-2.5-pro (Generous free tier, 1M ctx)")}`,
      `  ${c.cyan(c.bold("[2] OpenAI"))}            ${c.dim("gpt-4o, gpt-4o-mini, o3-mini")}`,
      `  ${c.cyan(c.bold("[3] Anthropic Claude"))}  ${c.dim("claude-3-7-sonnet, claude-3-5-sonnet")}`,
      `  ${c.cyan(c.bold("[4] DeepSeek"))}          ${c.dim("deepseek-chat (V3), deepseek-reasoner (R1)")}`,
      `  ${c.cyan(c.bold("[5] Groq"))}              ${c.dim("llama-3.3-70b (Ultra-fast LPUs)")}`,
      `  ${c.cyan(c.bold("[6] Ollama (Local)"))}    ${c.dim("100% private & offline models on your machine")}`,
      "",
      `Run interactive setup : ${c.cyan(c.bold("/connect"))}`,
      `Or direct connection  : ${c.cyan("/connect <provider> <api_key>")}`,
      `Or set environment var: ${c.dim("GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY...")}`,
    ];

    console.log(
      renderBox(lines, c.yellow("✦ AI Provider Setup"), {
        borderColor: c.yellow,
        rounded: true,
      })
    );
    console.log();
  }

  /**
   * GitHub Device Authorization Card (Zero Email / Single Click).
   */
  public static printDeviceAuthCard(userCode: string, verificationUri: string): void {
    const lines = [
      c.bold("GitHub OAuth Device Flow (No email or password needed)"),
      "",
      `  ${c.bold("1. Verification URL :")} ${c.underline(c.cyan(verificationUri))}`,
      `  ${c.bold("2. One-Time Code    :")} ${c.bold(c.green(userCode))}  ${c.dim("(Copied to clipboard!)")}`,
      "",
      c.dim("Browser launched automatically. Approve the code to sign in instantly."),
      c.dim("Waiting for authorization..."),
    ];

    console.log();
    console.log(
      renderBox(lines, c.green("🔒 GitHub Authentication"), {
        borderColor: c.green,
        rounded: true,
      })
    );
    console.log();
  }

  public static printDeviceAuthSuccess(username: string): void {
    console.log(c.green(`\n✓ Successfully authenticated as @${username}!\n`));
  }

  /**
   * OpenCode-style Tool Execution cards.
   */
  public static printToolStart(toolName: string, args: Record<string, unknown>): void {
    let detail = "";
    if (args.path) detail = String(args.path);
    else if (args.command) detail = String(args.command);
    else if (args.query) detail = String(args.query);
    else if (args.pattern) detail = String(args.pattern);

    console.log(
      `\n` +
        c.yellow(`╭─ ⚙ Tool Call: ${c.bold(toolName)} `) +
        (detail ? c.dim(`(${detail})`) : "")
    );
  }

  public static printToolEnd(
    toolName: string,
    success: boolean,
    output: string,
    error?: string,
    durationMs?: number
  ): void {
    const timeStr = durationMs !== undefined ? ` (${durationMs}ms)` : "";
    if (success) {
      const lineCount = output ? output.split("\n").length : 0;
      const preview = output.slice(0, 300).replace(/\r?\n/g, " ").trim();
      const summary =
        lineCount > 1
          ? `${lineCount} lines returned: ${preview.slice(0, 80)}...`
          : preview || "Success";

      console.log(c.yellow(`│`) + `  ${c.dim(summary)}`);
      console.log(c.yellow(`╰─ `) + c.green(`✓ Completed successfully${timeStr}\n`));
    } else {
      console.log(c.yellow(`│`) + `  ${c.red(error || "Execution failed")}`);
      console.log(c.yellow(`╰─ `) + c.red(`✗ Failed${timeStr}\n`));
    }
  }

  /**
   * OpenCode-style model catalog view.
   */
  public static printModelCatalog(
    models: Record<string, ModelInfo>,
    activeModelId?: string,
    providersStatus?: Record<string, { configured: boolean }>
  ): void {
    console.log(`\n${c.bold("Available Models in Recode:")}\n`);

    const colP = 12;
    const colA = 20;
    const colC = 10;
    const colS = 14;

    const header =
      padRight("Provider", colP) +
      padRight("Alias / Model", colA) +
      padRight("Context", colC) +
      padRight("Status", colS) +
      "Description";

    console.log(c.dim(header));
    console.log(c.dim("─".repeat(header.length + 30)));

    for (const [alias, m] of Object.entries(models)) {
      const isConfigured = providersStatus?.[m.provider]?.configured ?? false;
      const isActive =
        alias === activeModelId ||
        m.id === activeModelId ||
        (activeModelId && activeModelId.includes(alias));

      let statusStr = isConfigured ? c.green("● Connected") : c.dim("○ No key");
      if (isActive) {
        statusStr = c.cyan(c.bold("★ Active"));
      }

      const ctxStr = `${Math.round(m.contextWindow / 1000)}k`;
      const row =
        padRight(m.provider.toUpperCase(), colP) +
        padRight(alias, colA) +
        padRight(ctxStr, colC) +
        padRight(statusStr, colS) +
        c.dim(m.description || "");

      console.log(row);
    }

    console.log(
      `\n${c.dim("Switch model:")} ${c.cyan("/model <name>")}  ${c.dim("Example:")} ${c.cyan("/model gemini-2.5-flash")}\n`
    );
  }

  /**
   * Help dialog in OpenCode style.
   */
  public static printHelp(): void {
    const lines = [
      c.bold("Recode Terminal — Commands & Shortcuts"),
      "",
      `  ${c.cyan(c.bold("/connect"))}           Interactive provider setup (Gemini, OpenAI, Claude, DeepSeek...)`,
      `  ${c.cyan(c.bold("/connect <p> <key>"))} Connect provider with key (e.g. /connect gemini <key>)`,
      `  ${c.cyan(c.bold("/models"))}            List available AI models and their context windows`,
      `  ${c.cyan(c.bold("/model <name>"))}      Switch active model (e.g. /model gemini-2.5-flash)`,
      `  ${c.cyan(c.bold("/mode [build|plan]"))} Toggle mode (Build = autonomous edits, Plan = analysis only)`,
      `  ${c.cyan(c.bold("/login"))}             Sign in with GitHub (Zero Email Device Flow)`,
      `  ${c.cyan(c.bold("/logout"))}            Sign out of GitHub`,
      `  ${c.cyan(c.bold("/status"))}            Show auth & connection status`,
      `  ${c.cyan(c.bold("/clear"))}             Clear the conversation history & screen`,
      `  ${c.cyan(c.bold("/exit"))}              Exit Recode Terminal`,
      "",
      c.bold("Context Tags & Inline Shell:"),
      `  ${c.yellow("@<filepath>")}              Attach file to context (e.g. "explain @src/index.ts")`,
      `  ${c.yellow("!<command>")}               Execute shell command inline (e.g. "!git status")`,
    ];

    console.log(
      renderBox(lines, c.cyan("⌨ Recode Command Reference"), {
        borderColor: c.cyan,
        rounded: true,
      })
    );
    console.log();
  }
}
