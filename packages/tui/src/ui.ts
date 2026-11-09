import path from "node:path";
import { c } from "./colors.js";
import { renderBox, padRight, visibleWidth } from "./text.js";
import { AuthStatus, ModelInfo } from "@recode-dev/sdk";

export class UI {
  /**
   * Top Pill Badge inspired by Claude Code (Image 1 & 4).
   * ZERO emojis: uses '*' bullet and clean box-drawing glyphs.
   */
  public static printPill(text: string): void {
    console.log(`\n  ${c.cyan("*")} ${c.bold(text)}\n`);
  }

  /**
   * Giant double-stroke retro ASCII Banner with Robot Mascot (Image 1 & 2).
   */
  public static printBanner(version = "1.30.2"): void {
    const bannerLines = [
      " ██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ███████╗",
      " ██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝",
      " ██████╔╝█████╗  ██║     ██║   ██║██║  ██║█████╗  ",
      " ██╔══██╗██╔══╝  ██║     ██║   ██║██║  ██║██╔══╝  ",
      " ██║  ██║███████╗╚██████╗╚██████╔╝██████╔╝███████╗",
      " ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝",
    ];

    console.log();
    for (const line of bannerLines) {
      console.log(c.cyan(line));
    }
    console.log(
      `  ${c.dim("Autonomous AI Software Engineering Terminal")} ${c.gray("·")} ${c.cyan(c.bold(`v${version}`))}\n`
    );
  }

  /**
   * Philosophy / Code Poem block inspired by Image 4.
   */
  public static printPhilosophy(): void {
    const code = [
      `  ${c.dim("while")}(${c.cyan("curious")}) {`,
      `      ${c.magenta("question_everything")}();`,
      `      ${c.magenta("dig_deeper")}();`,
      `      ${c.magenta("connect_dots")}(${c.dim("unexpected")});`,
      "",
      `      ${c.dim("if")} (${c.cyan("stuck")}) {`,
      `          ${c.yellow("keep_thinking")}();`,
      `      }`,
      `  }`,
    ];
    console.log(code.join("\n") + "\n");
  }

  /**
   * Multi-column Dashboard Card inspired by Claude Code (Image 3).
   */
  public static printDashboard(
    status: AuthStatus,
    workspaceDir: string,
    currentModel: string,
    mode: "build" | "plan" = "build",
    version = "1.30.2"
  ): void {
    const relPath = path.basename(workspaceDir) || workspaceDir;
    const userBadge = status.github
      ? `@${status.github.username}`
      : "Guest (run /login)";

    const modelName =
      currentModel === "(unconfigured)"
        ? "No key set (/connect)"
        : currentModel;

    const modeBadge = mode === "build" ? "[BUILD] Auto-edit" : "[PLAN] Read-only";

    const leftCol = [
      c.bold("Welcome to Recode!"),
      "",
      `    ${c.cyan("[■■■]")}`,
      `   ${c.cyan("[ o o ]")}`,
      `    ${c.cyan("[===]")}`,
      "",
      `${c.bold("Model:")} ${c.cyan(modelName)}`,
      `${c.bold("Mode :")} ${mode === "build" ? c.green(modeBadge) : c.magenta(modeBadge)}`,
      `${c.bold("Path :")} ${c.dim(relPath)}`,
      `${c.bold("User :")} ${c.white(userBadge)}`,
    ];

    const rightColTop = [
      c.bold("Recent Activity"),
      `${c.dim("1m ago")}   Loaded workspace context`,
      `${c.dim("8m ago")}   Configured AI providers`,
      `${c.dim("2d ago")}   Initialized Recode engine`,
      `${c.dim(".../status for more")}`,
    ];

    const rightColBottom = [
      c.bold("What's new"),
      `${c.cyan("/mode")}     Toggle Build vs Plan mode`,
      `${c.cyan("/connect")}  Connect Gemini, OpenAI, Claude, DeepSeek`,
      `${c.cyan("@file")}     Instant file context lookup`,
      `${c.cyan("!<cmd>")}    Inline shell command execution`,
      `${c.dim(".../help for more")}`,
    ];

    // Combine into a multi-column bordered card
    const cardLines = [
      `╭─ Recode Agent v${version} ─────────────────────────────────────────────────────────────╮`,
      `│  ${padRight(leftCol[0], 28)} │  ${padRight(rightColTop[0], 42)}│`,
      `│  ${padRight(leftCol[1], 28)} │  ${padRight(rightColTop[1], 42)}│`,
      `│  ${padRight(leftCol[2], 28)} │  ${padRight(rightColTop[2], 42)}│`,
      `│  ${padRight(leftCol[3], 28)} │  ${padRight(rightColTop[3], 42)}│`,
      `│  ${padRight(leftCol[4], 28)} │  ${padRight(rightColTop[4], 42)}│`,
      `│  ${padRight(leftCol[5], 28)} ├────────────────────────────────────────────┤`,
      `│  ${padRight(leftCol[6], 28)} │  ${padRight(rightColBottom[0], 42)}│`,
      `│  ${padRight(leftCol[7], 28)} │  ${padRight(rightColBottom[1], 42)}│`,
      `│  ${padRight(leftCol[8], 28)} │  ${padRight(rightColBottom[2], 42)}│`,
      `│  ${padRight(leftCol[9], 28)} │  ${padRight(rightColBottom[3], 42)}│`,
      `╰──────────────────────────────┴────────────────────────────────────────────╯`,
    ];

    console.log(cardLines.join("\n") + "\n");
  }

  /**
   * Ready status checks inspired by DeepAgents (Image 2).
   */
  public static printReadyChecks(sessionId: string): void {
    const threadId = sessionId.split("_").pop() || "main";
    console.log(`  ${c.green("[✓]")} Recode engine: ${c.bold("ready")}`);
    console.log(`  ${c.green("[✓]")} Thread: ${c.cyan(threadId)}`);
    console.log(`  ${c.green("[✓]")} Loaded autonomous tools: ${c.dim("read, write, edit, exec, grep, search")}`);
    console.log(`\n  ${c.bold("Ready to code! What would you like to build?")}`);
    console.log(`  ${c.dim("Enter send  •  Ctrl+J newline  •  @ files  •  / commands")}\n`);
  }

  /**
   * Full Hero Header: Banner + Philosophy + Dashboard + Status Checks.
   */
  public static printHeader(
    status: AuthStatus,
    workspaceDir: string,
    currentModel: string,
    mode: "build" | "plan" = "build",
    version = "1.30.2",
    sessionId = "session_main"
  ): void {
    this.printPill(`Welcome to Recode Terminal Coding Agent! [v${version}]`);
    this.printBanner(version);
    this.printPhilosophy();
    this.printDashboard(status, workspaceDir, currentModel, mode, version);
    this.printReadyChecks(sessionId);
  }

  /**
   * Message Container for User Turn (Image 2 & user request).
   * Uses clear vertical bar or rounded box with ZERO emojis.
   */
  public static printUserMessage(prompt: string): void {
    console.log(`\n  ${c.cyan("│")} ${c.bold("> " + prompt)}\n`);
  }

  /**
   * Assistant Response Container Header (ZERO emojis).
   */
  public static printAssistantStart(): void {
    console.log(`  ${c.cyan("╭─ [recode]")}`);
  }

  public static printAssistantEnd(): void {
    console.log(`  ${c.cyan("╰──────────────────────────────────────────────────")}\n`);
  }

  /**
   * Live Thinking Container / Simmering block (Image 4 & user request).
   * Displays live elapsed seconds or structured reasoning.
   */
  public static printThinkingSummary(durationSeconds: number): void {
    console.log(`  ${c.dim(`[✓] Thought for ${durationSeconds.toFixed(1)}s`)}\n`);
  }

  public static printThinkingBlock(reasoning: string, durationSeconds?: number): void {
    const durStr = durationSeconds !== undefined ? ` · ${durationSeconds.toFixed(1)}s` : "";
    const lines = [
      c.yellow(`  ╭─ [think] (Reasoning${durStr}) ───────────────────────`),
      ...reasoning
        .trim()
        .split("\n")
        .map((l) => c.yellow("  │ ") + c.dim(l)),
      c.yellow(`  ╰──────────────────────────────────────────────────`),
    ];
    console.log(lines.join("\n"));
  }

  /**
   * Tool Execution Card (ZERO emojis).
   */
  public static printToolStart(toolName: string, args: Record<string, unknown>): void {
    let detail = "";
    if (args.path) detail = String(args.path);
    else if (args.command) detail = String(args.command);
    else if (args.query) detail = String(args.query);
    else if (args.pattern) detail = String(args.pattern);

    console.log(
      `\n  ${c.yellow("╭─ [tool]")} ${c.bold(toolName)} ` +
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
      const preview = output.slice(0, 250).replace(/\r?\n/g, " ").trim();
      const summary =
        lineCount > 1
          ? `${lineCount} lines: ${preview.slice(0, 70)}...`
          : preview || "Success";

      console.log(`  ${c.yellow("│")}   ${c.dim(summary)}`);
      console.log(`  ${c.yellow("╰─")} ${c.green(`[✓] Completed successfully${timeStr}`)}\n`);
    } else {
      console.log(`  ${c.yellow("│")}   ${c.red(error || "Execution failed")}`);
      console.log(`  ${c.yellow("╰─")} ${c.red(`[x] Failed${timeStr}`)}\n`);
    }
  }

  /**
   * Bottom Status Dock (Image 2 inspired).
   * Spans bottom dock with mode, workspace, token counter, and active model.
   */
  public static printStatusDock(
    mode: "build" | "plan",
    workspaceDir: string,
    tokens: number,
    modelName: string
  ): void {
    const relPath = path.basename(workspaceDir) || workspaceDir;
    const modeBadge = mode === "build" ? c.green(c.bold("[BUILD]")) : c.magenta(c.bold("[PLAN]"));
    const tokenStr = `${(tokens / 1000).toFixed(1)}k tokens`;

    const dock = `  ${modeBadge} ${c.dim("[shift+tab: mode]")}  ${c.white(relPath)}  ${c.gray("│")}  ${c.dim(tokenStr)}  ${c.gray("│")}  ${c.cyan(modelName)}`;
    console.log(c.dim("─".repeat(72)));
    console.log(dock);
    console.log(c.dim("─".repeat(72)) + "\n");
  }

  /**
   * AI Provider Onboarding Card (ZERO emojis).
   */
  public static printConnectMenu(): void {
    const lines = [
      c.bold("Connect an AI Provider (BYOK — Bring Your Own Key)"),
      c.dim("Recode is 100% provider-agnostic. Connect your preferred key:"),
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
      renderBox(lines, c.yellow("[connect] AI Provider Setup"), {
        borderColor: c.yellow,
        rounded: true,
      })
    );
    console.log();
  }

  /**
   * GitHub Device Authorization Card (ZERO emojis).
   */
  public static printDeviceAuthCard(userCode: string, verificationUri: string): void {
    const lines = [
      c.bold("GitHub OAuth Device Flow (No email or password needed)"),
      "",
      `  ${c.bold("1. Verification URL :")} ${c.underline(c.cyan(verificationUri))}`,
      `  ${c.bold("2. One-Time Code    :")} ${c.bold(c.green(userCode))}  ${c.dim("(Copied to clipboard)")}`,
      "",
      c.dim("Browser launched automatically. Approve the code to sign in instantly."),
      c.dim("Waiting for authorization..."),
    ];

    console.log();
    console.log(
      renderBox(lines, c.green("[auth] GitHub Device Authentication"), {
        borderColor: c.green,
        rounded: true,
      })
    );
    console.log();
  }

  public static printDeviceAuthSuccess(username: string): void {
    console.log(c.green(`\n[✓] Successfully authenticated as @${username}!\n`));
  }

  /**
   * Model catalog table (ZERO emojis).
   */
  public static printModelCatalog(
    models: Record<string, ModelInfo>,
    activeModelId?: string,
    providersStatus?: Record<string, { configured: boolean }>
  ): void {
    console.log(`\n  ${c.bold("Available Models in Recode:")}\n`);

    const colP = 12;
    const colA = 20;
    const colC = 10;
    const colS = 14;

    const header =
      "  " +
      padRight("Provider", colP) +
      padRight("Alias / Model", colA) +
      padRight("Context", colC) +
      padRight("Status", colS) +
      "Description";

    console.log(c.dim(header));
    console.log(c.dim("  " + "─".repeat(header.length + 20)));

    for (const [alias, m] of Object.entries(models)) {
      const isConfigured = providersStatus?.[m.provider]?.configured ?? false;
      const isActive =
        alias === activeModelId ||
        m.id === activeModelId ||
        (activeModelId && activeModelId.includes(alias));

      let statusStr = isConfigured ? c.green("[✓] Connected") : c.dim("[ ] No key");
      if (isActive) {
        statusStr = c.cyan(c.bold("[*] Active"));
      }

      const ctxStr = `${Math.round(m.contextWindow / 1000)}k`;
      const row =
        "  " +
        padRight(m.provider.toUpperCase(), colP) +
        padRight(alias, colA) +
        padRight(ctxStr, colC) +
        padRight(statusStr, colS) +
        c.dim(m.description || "");

      console.log(row);
    }

    console.log(
      `\n  ${c.dim("Switch model:")} ${c.cyan("/model <name>")}  ${c.dim("Example:")} ${c.cyan("/model gemini-2.5-flash")}\n`
    );
  }

  /**
   * Help dialog (ZERO emojis).
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
      `  ${c.cyan(c.bold("/status"))}            Show auth, git & connection status`,
      `  ${c.cyan(c.bold("/diff"))}              Show git diff in working directory`,
      `  ${c.cyan(c.bold("/clear"))}             Clear the conversation history & screen`,
      `  ${c.cyan(c.bold("/exit"))}              Exit Recode Terminal`,
      "",
      c.bold("Context Tags & Inline Shell:"),
      `  ${c.yellow("@<filepath>")}              Attach file to context (e.g. "explain @src/index.ts")`,
      `  ${c.yellow("!<command>")}               Execute shell command inline (e.g. "!git status")`,
      "",
      c.bold("Keyboard Shortcuts:"),
      `  ${c.dim("Shift+Tab")}                   Cycle between Build and Plan modes`,
      `  ${c.dim("Ctrl+C")}                      Interrupt active agent turn`,
    ];

    console.log(
      renderBox(lines, c.cyan("[help] Recode Command Reference"), {
        borderColor: c.cyan,
        rounded: true,
      })
    );
    console.log();
  }
}
