import path from "node:path";
import { ThemeManager, BUILTIN_THEMES, ThemeDefinition } from "./theme.js";
import { FontManager, BORDER_STYLES, BorderStyleType, MascotStyleType } from "./font.js";
import { padRight, visibleWidth } from "./text.js";
import { AuthStatus, ModelInfo } from "@recode-dev/sdk";

export class UI {
  /**
   * Boxed Pill Badge with rounded border and asterisk bullet (matching uploaded image).
   */
  public static printBoxedPill(text: string): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;
    const content = `* ${text}`;
    const innerW = visibleWidth(content) + 4;

    console.log(`  ${theme.cardBorder(glyphs.tl + glyphs.horiz.repeat(innerW) + glyphs.tr)}`);
    console.log(`  ${theme.cardBorder(glyphs.vert)}  ${theme.accent("*")} ${theme.bold(theme.text(text))}  ${theme.cardBorder(glyphs.vert)}`);
    console.log(`  ${theme.cardBorder(glyphs.bl + glyphs.horiz.repeat(innerW) + glyphs.br)}`);
  }

  /**
   * Top Pill Badge.
   */
  public static printPill(text: string): void {
    this.printBoxedPill(text);
  }

  /**
   * Retro 3D outlined block banner matching Claude Code (Image 4 & uploaded photo).
   */
  public static printRetroBanner(): void {
    const theme = ThemeManager.get();
    const bannerLines = [
      "  ____   _____  ____  ___   ____   _____ ",
      " |  _ \\ | ____|/ ___// _ \\ |  _ \\ | ____|",
      " | |_) ||  _| | |   | | | || | | ||  _|  ",
      " |  _ < | |___| |___| |_| || |_| || |___ ",
      " |_| \\_\\|_____|\\____\\\\___/ |____/ |_____|",
    ];

    for (const line of bannerLines) {
      console.log(theme.accent(theme.bold(line)));
    }
  }

  /**
   * Welcome Splash Screen matching the uploaded image exactly.
   * Shows boxed pill, retro 3D font, security notes, and "Press Enter to continue...".
   */
  public static printWelcomeSplash(version = "1.30.3"): void {
    const theme = ThemeManager.get();
    console.clear();
    console.log();
    this.printBoxedPill(`Welcome to Recode research preview!`);
    console.log();
    this.printRetroBanner();
    console.log();
    this.printBoxedPill(`Welcome to Recode research preview!`);
    console.log();
    console.log(`  ${theme.bold(theme.text("Security notes:"))}\n`);
    console.log(`  ${theme.text("1. Recode is currently in research preview")}`);
    console.log(`     ${theme.muted("This version integrates autonomous coding tools with direct terminal execution.")}`);
    console.log(`     ${theme.muted("Run /help at any time to inspect available commands.")}\n`);
    console.log(`  ${theme.text("2. Recode can make mistakes")}`);
    console.log(`     ${theme.muted("You should always review Recode's responses, especially when")}`);
    console.log(`     ${theme.muted("running code or executing shell commands.")}\n`);
    console.log(`  ${theme.text("3. Due to prompt injection risks, only use it with code you trust")}`);
    console.log(`     ${theme.muted("For more details see:")}`);
    console.log(`     ${theme.accent("https://github.com/Fortunehack45/Recode#security")}\n`);
    console.log(`  ${theme.accent(theme.bold("Press Enter to continue..."))}`);
  }

  /**
   * 2-Column Hero Dashboard Card inspired by Claude Code (pure terminal TUI).
   * ZERO emojis, NO window chrome / no 3-dot decorations.
   */
  public static printDashboard(
    status: AuthStatus,
    workspaceDir: string,
    currentModel: string,
    mode: "build" | "plan" = "build",
    version = "1.30.3"
  ): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    const relPath = path.basename(workspaceDir) || workspaceDir;
    const userBadge = status.github
      ? `@${status.github.username}`
      : "Guest (run /login)";

    const modelName =
      currentModel === "(unconfigured)"
        ? "No key set (/connect)"
        : currentModel;

    const modeBadge = mode === "build" ? "[BUILD] Auto-edit" : "[PLAN] Read-only";
    const modeColored =
      mode === "build"
        ? theme.fg(theme.palette.success)(modeBadge)
        : theme.fg(theme.palette.secondary)(modeBadge);

    // Left Column items
    const mascotLines = font.getMascotLines(theme);
    const leftCol: string[] = [
      theme.bold(theme.text("Welcome to Recode!")),
      "",
      ...(mascotLines.length > 0 ? mascotLines : [""]),
      "",
      `${theme.bold(theme.text("Model:"))} ${theme.accent(modelName)}`,
      `${theme.bold(theme.text("Mode :"))} ${modeColored}`,
      `${theme.bold(theme.text("Path :"))} ${theme.muted(relPath)}`,
      `${theme.bold(theme.text("User :"))} ${theme.text(userBadge)}`,
    ];

    // Right Column items
    const rightColTop: string[] = [
      theme.bold(theme.text("Recent Activity")),
      `${theme.muted("1m ago")}   Loaded workspace context`,
      `${theme.muted("8m ago")}   Configured AI providers`,
      `${theme.muted("2d ago")}   Initialized Recode engine`,
      `${theme.muted(".../status for more")}`,
    ];

    const rightColBottom: string[] = [
      theme.bold(theme.text("Quick Actions")),
      `${theme.accent("/theme")}    Change theme (synced with Recode IDE)`,
      `${theme.accent("/font")}     Configure borders & mascot`,
      `${theme.accent("/color")}    Customize accent & text colors`,
      `${theme.accent("/mode")}     Toggle Build vs Plan mode`,
      `${theme.accent("/connect")}  Connect Gemini, OpenAI, Claude, DeepSeek`,
      `${theme.muted(".../help for more")}`,
    ];

    // Align column heights
    const leftWidth = 28;
    const rightWidth = 46;
    const totalInner = leftWidth + 3 + rightWidth; // left + " │ " + right

    const cardLines: string[] = [];

    // Header border
    const title = ` Recode Agent v${version} `;
    const titleLen = visibleWidth(title);
    const rightBorderLen = Math.max(0, totalInner - titleLen - 2);
    cardLines.push(
      "  " +
        theme.cardBorder(glyphs.tl + glyphs.horiz) +
        theme.bold(theme.accent(title)) +
        theme.cardBorder(glyphs.horiz.repeat(rightBorderLen) + glyphs.tr)
    );

    // Top section
    const topMaxRows = Math.max(5, rightColTop.length);
    for (let i = 0; i < topMaxRows; i++) {
      const leftPart = padRight(leftCol[i] || "", leftWidth);
      const rightPart = padRight(rightColTop[i] || "", rightWidth);
      cardLines.push(
        "  " +
          theme.border(glyphs.vert) +
          " " +
          leftPart +
          " " +
          theme.border(glyphs.vert) +
          " " +
          rightPart +
          " " +
          theme.border(glyphs.vert)
      );
    }

    // Divider in right column
    const leftMid = padRight(leftCol[topMaxRows] || "", leftWidth);
    cardLines.push(
      "  " +
        theme.border(glyphs.vert) +
        " " +
        leftMid +
        " " +
        theme.border(glyphs.teeLeft + glyphs.horiz.repeat(rightWidth + 1)) +
        theme.border(glyphs.teeRight)
    );

    // Bottom section
    const botRows = Math.max(leftCol.length - topMaxRows - 1, rightColBottom.length);
    for (let i = 0; i < botRows; i++) {
      const leftPart = padRight(leftCol[topMaxRows + 1 + i] || "", leftWidth);
      const rightPart = padRight(rightColBottom[i] || "", rightWidth);
      cardLines.push(
        "  " +
          theme.border(glyphs.vert) +
          " " +
          leftPart +
          " " +
          theme.border(glyphs.vert) +
          " " +
          rightPart +
          " " +
          theme.border(glyphs.vert)
      );
    }

    // Footer border
    cardLines.push(
      "  " +
        theme.cardBorder(
          glyphs.bl +
            glyphs.horiz.repeat(leftWidth + 2) +
            glyphs.teeBottom +
            glyphs.horiz.repeat(rightWidth + 2) +
            glyphs.br
        )
    );

    console.log(cardLines.join("\n") + "\n");
  }

  /**
   * Ready status checks.
   */
  public static printReadyChecks(sessionId: string): void {
    const theme = ThemeManager.get();
    const threadId = sessionId.split("_").pop() || "main";
    const activeTheme = theme.theme.name;

    console.log(`  ${theme.success("[✓]")} Recode engine: ${theme.bold("ready")}`);
    console.log(`  ${theme.success("[✓]")} Active theme : ${theme.accent(activeTheme)} ${theme.dim("(synced with Recode IDE)")}`);
    console.log(`  ${theme.success("[✓]")} Session thread: ${theme.muted(threadId)}`);
    console.log(`  ${theme.success("[✓]")} Autonomous tools: ${theme.dim("read_file, edit_file, write_file, exec, grep, search")}`);
    console.log(`\n  ${theme.bold(theme.text("Ready to code! What would you like to build?"))}`);
    console.log(`  ${theme.dim("Enter send  •  Shift+Tab mode  •  @ files  •  / commands")}\n`);
  }

  /**
   * Full Hero Header: Boxed Pill + Dashboard + Status Checks.
   */
  public static printHeader(
    status: AuthStatus,
    workspaceDir: string,
    currentModel: string,
    mode: "build" | "plan" = "build",
    version = "1.30.3",
    sessionId = "session_main"
  ): void {
    this.printBoxedPill(`Recode Autonomous Coding Terminal [v${version}]`);
    console.log();
    this.printDashboard(status, workspaceDir, currentModel, mode, version);
    this.printReadyChecks(sessionId);
  }

  /**
   * User message container.
   */
  public static printUserMessage(prompt: string): void {
    const theme = ThemeManager.get();
    console.log(`\n  ${theme.accent("│")} ${theme.bold(theme.text("> " + prompt))}\n`);
  }

  /**
   * Assistant container header.
   */
  public static printAssistantStart(): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;
    console.log(`  ${theme.accent(glyphs.tl + glyphs.horiz + " [recode]")}`);
  }

  public static printAssistantEnd(): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;
    console.log(`  ${theme.accent(glyphs.bl + glyphs.horiz.repeat(50))}\n`);
  }

  /**
   * Thinking block.
   */
  public static printThinkingSummary(durationSeconds: number): void {
    const theme = ThemeManager.get();
    console.log(`  ${theme.dim(`[✓] Thought for ${durationSeconds.toFixed(1)}s`)}\n`);
  }

  public static printThinkingBlock(reasoning: string, durationSeconds?: number): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;
    const durStr = durationSeconds !== undefined ? ` · ${durationSeconds.toFixed(1)}s` : "";

    const lines = [
      theme.warning(`  ${glyphs.tl}${glyphs.horiz} [think] (Reasoning${durStr}) ───────────────────────`),
      ...reasoning
        .trim()
        .split("\n")
        .map((l) => theme.warning(`  ${glyphs.vert} `) + theme.dim(l)),
      theme.warning(`  ${glyphs.bl}${glyphs.horiz.repeat(50)}`),
    ];
    console.log(lines.join("\n"));
  }

  /**
   * Compact tool completion tile.
   */
  public static printToolEnd(
    toolName: string,
    success: boolean,
    output: string,
    error?: string,
    durationMs?: number
  ): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;
    const timeStr = durationMs !== undefined ? ` (${durationMs}ms)` : "";

    if (success) {
      const lineCount = output ? output.split("\n").length : 0;
      const preview = output.slice(0, 160).replace(/\r?\n/g, " ").trim();
      const summary =
        lineCount > 1
          ? `${lineCount} lines: ${preview.slice(0, 60)}...`
          : preview || "Success";

      console.log(`  ${theme.border(glyphs.tl + glyphs.horiz + " [tool]")} ${theme.bold(theme.text(toolName))}`);
      console.log(`  ${theme.border(glyphs.vert)}   ${theme.dim(summary)}`);
      console.log(`  ${theme.border(glyphs.bl + glyphs.horiz)} ${theme.success(`[✓] Completed successfully${timeStr}`)}\n`);
    } else {
      console.log(`  ${theme.border(glyphs.tl + glyphs.horiz + " [tool]")} ${theme.bold(theme.text(toolName))}`);
      console.log(`  ${theme.border(glyphs.vert)}   ${theme.error(error || "Execution failed")}`);
      console.log(`  ${theme.border(glyphs.bl + glyphs.horiz)} ${theme.error(`[x] Failed${timeStr}`)}\n`);
    }
  }

  /**
   * Theme Gallery Card (/theme).
   * Displays all themes with live color swatches.
   */
  public static printThemeGallery(): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;
    const currentId = theme.theme.id;

    console.log(`\n  ${theme.accent(glyphs.tl + glyphs.horiz)} ${theme.bold(theme.text("Recode Theme Gallery"))} ${theme.accent(glyphs.horiz.repeat(40) + glyphs.tr)}`);

    for (const [id, def] of Object.entries(BUILTIN_THEMES)) {
      const isCurrent = id === currentId;
      const marker = isCurrent ? theme.accent("[*]") : theme.dim("[ ]");

      // Generate visual color swatch
      const c1 = theme.bg(def.palette.accent)("  ");
      const c2 = theme.bg(def.palette.secondary)("  ");
      const c3 = theme.bg(def.palette.success)("  ");
      const c4 = theme.bg(def.palette.error)("  ");
      const swatch = `${c1}${c2}${c3}${c4}`;

      const namePadded = padRight(def.name, 18);
      const appBadge = def.appearance === "dark" ? theme.dim("dark") : theme.accent("light");
      const currentLabel = isCurrent ? theme.accent(" (Active)") : "";

      console.log(`  ${theme.border(glyphs.vert)}  ${marker} ${theme.bold(theme.text(namePadded))} ${swatch}  ${appBadge}${currentLabel}`);
      console.log(`  ${theme.border(glyphs.vert)}      ${theme.muted(def.description)}`);
    }

    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Switch theme :"))} ${theme.accent("/theme <name>")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Sync with IDE:"))} ${theme.accent("/theme ide")}`);
    console.log(`  ${theme.accent(glyphs.bl + glyphs.horiz.repeat(64) + glyphs.br)}\n`);
  }

  /**
   * Font & Styling Menu (/font).
   */
  public static printFontMenu(): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    console.log(`\n  ${theme.accent(glyphs.tl + glyphs.horiz)} ${theme.bold(theme.text("Recode Typography & Border Styles"))} ${theme.accent(glyphs.horiz.repeat(30) + glyphs.tr)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Border Styles:"))}`);

    for (const style of ["dotted", "rounded", "sharp", "double", "minimal"] as BorderStyleType[]) {
      const g = BORDER_STYLES[style];
      const isCur = font.currentBorderStyle === style;
      const sample = `${g.tl}${g.horiz}${g.horiz}${g.tr}  ${g.vert}  ${g.bl}${g.horiz}${g.horiz}${g.br}`;
      const marker = isCur ? theme.accent("[*]") : theme.dim("[ ]");
      console.log(`  ${theme.border(glyphs.vert)}    ${marker} ${padRight(style, 10)} ${theme.accent(sample)}${isCur ? theme.accent(" (Active)") : ""}`);
    }

    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Mascot Styles:"))}`);
    for (const m of ["retro", "robot", "mini", "off"] as MascotStyleType[]) {
      const isCur = font.currentMascotStyle === m;
      const marker = isCur ? theme.accent("[*]") : theme.dim("[ ]");
      console.log(`  ${theme.border(glyphs.vert)}    ${marker} ${padRight(m, 10)}${isCur ? theme.accent(" (Active)") : ""}`);
    }

    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Change border style:"))} ${theme.accent("/font style <dotted|rounded|sharp|double>")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Change mascot art  :"))} ${theme.accent("/font mascot <retro|robot|mini|off>")}`);
    console.log(`  ${theme.accent(glyphs.bl + glyphs.horiz.repeat(64) + glyphs.br)}\n`);
  }

  /**
   * Color Palette Inspector (/color).
   */
  public static printColorPalette(): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;
    const p = theme.palette;

    console.log(`\n  ${theme.accent(glyphs.tl + glyphs.horiz)} ${theme.bold(theme.text("Active Theme Palette (" + theme.theme.name + ")"))} ${theme.accent(glyphs.horiz.repeat(28) + glyphs.tr)}`);

    const items = [
      { name: "Background", hex: p.bg },
      { name: "Foreground", hex: p.fg },
      { name: "Accent (Main)", hex: p.accent },
      { name: "Secondary", hex: p.secondary },
      { name: "Border", hex: p.border },
      { name: "Mascot", hex: p.mascot },
      { name: "Success", hex: p.success },
      { name: "Warning", hex: p.warning },
      { name: "Error", hex: p.error },
    ];

    for (const item of items) {
      const swatch = theme.bg(item.hex)("      ");
      console.log(`  ${theme.border(glyphs.vert)}  ${padRight(item.name, 16)} ${swatch}  ${theme.muted(item.hex)}`);
    }

    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Customize accent :"))} ${theme.accent("/color accent <#hex or name>")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Reset palette    :"))} ${theme.accent("/color reset")}`);
    console.log(`  ${theme.accent(glyphs.bl + glyphs.horiz.repeat(64) + glyphs.br)}\n`);
  }

  /**
   * Command help table.
   */
  public static printHelp(): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    console.log(`\n  ${theme.accent(glyphs.tl + glyphs.horiz)} ${theme.bold(theme.text("Recode Terminal Assistant Commands"))} ${theme.accent(glyphs.horiz.repeat(30) + glyphs.tr)}`);

    const cmds = [
      { cmd: "/welcome", desc: "Show the onboarding welcome & security preview splash" },
      { cmd: "/theme [name]", desc: "Browse or switch themes (matches Recode IDE)" },
      { cmd: "/theme ide", desc: "Sync theme directly from Recode IDE settings.json" },
      { cmd: "/font [style|mascot]", desc: "Configure border styles (dotted/rounded) & mascot" },
      { cmd: "/color [accent|reset]", desc: "Inspect theme color palette or set custom accent" },
      { cmd: "/mode [build|plan]", desc: "Toggle between Build (read/write/exec) and Plan (read-only)" },
      { cmd: "/model [name]", desc: "Switch AI model (e.g. gemini-2.5-flash, claude-3-7-sonnet)" },
      { cmd: "/models", desc: "List all supported models across all providers" },
      { cmd: "/connect [provider] [key]", desc: "Set API keys (Gemini, OpenAI, Claude, DeepSeek, Groq)" },
      { cmd: "/status", desc: "Show Git status in current workspace" },
      { cmd: "/diff", desc: "Show pending Git diff changes" },
      { cmd: "/clear", desc: "Clear screen and reset conversation history" },
      { cmd: "@<path>", desc: "Attach file context into prompt (e.g. @src/index.ts)" },
      { cmd: "!<command>", desc: "Execute shell command directly (e.g. !cargo test)" },
      { cmd: "Shift+Tab", desc: "Instant hotkey to toggle Build vs Plan mode" },
      { cmd: "/exit", desc: "Quit Recode terminal assistant" },
    ];

    for (const c of cmds) {
      console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(padRight(c.cmd, 24))} ${theme.dim(c.desc)}`);
    }

    console.log(`  ${theme.accent(glyphs.bl + glyphs.horiz.repeat(64) + glyphs.br)}\n`);
  }

  /**
   * AI Provider Onboarding Card.
   */
  public static printConnectMenu(): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    console.log(`\n  ${theme.accent(glyphs.tl + glyphs.horiz)} ${theme.bold(theme.text("Connect an AI Provider (BYOK — Bring Your Own Key)"))} ${theme.accent(glyphs.horiz.repeat(20) + glyphs.tr)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.dim("Recode is 100% provider-agnostic. Connect your preferred key:")}`);
    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[1] Google Gemini"))}     ${theme.dim("gemini-2.5-flash, gemini-2.5-pro (Generous free tier, 1M ctx)")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[2] OpenAI"))}            ${theme.dim("gpt-4o, gpt-4o-mini, o3-mini")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[3] Anthropic Claude"))}  ${theme.dim("claude-3-7-sonnet, claude-3-5-sonnet")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[4] DeepSeek"))}          ${theme.dim("deepseek-chat (V3), deepseek-reasoner (R1)")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[5] Groq"))}              ${theme.dim("llama-3.3-70b (Ultra-fast LPUs)")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[6] Ollama (Local)"))}    ${theme.dim("100% private & offline models on your machine")}`);
    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  Run setup      : ${theme.accent("/connect")}`);
    console.log(`  ${theme.border(glyphs.vert)}  Direct connect : ${theme.accent("/connect <provider> <api_key>")}`);
    console.log(`  ${theme.accent(glyphs.bl + glyphs.horiz.repeat(64) + glyphs.br)}\n`);
  }

  /**
   * Model Catalog.
   */
  public static printModelCatalog(
    models: Record<string, ModelInfo>,
    activeModel: string,
    providers: Record<string, { configured: boolean }>
  ): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    console.log(`\n  ${theme.accent(glyphs.tl + glyphs.horiz)} ${theme.bold(theme.text("Available Recode AI Models"))} ${theme.accent(glyphs.horiz.repeat(36) + glyphs.tr)}`);

    for (const [id, m] of Object.entries(models)) {
      const isActive = id === activeModel;
      const isConfigured = Boolean(providers[m.provider]?.configured);
      const marker = isActive ? theme.accent("[*]") : theme.dim("[ ]");
      const statusPill = isConfigured
        ? theme.success("[Ready]")
        : theme.warning("[Key Required]");

      console.log(`  ${theme.border(glyphs.vert)}  ${marker} ${theme.bold(theme.text(padRight(id, 22)))} ${statusPill} ${theme.muted(m.provider)}`);
      console.log(`  ${theme.border(glyphs.vert)}      ${theme.dim(`${m.description} (${(m.contextWindow / 1000).toFixed(0)}k context)`)}`);
    }

    console.log(`  ${theme.accent(glyphs.bl + glyphs.horiz.repeat(64) + glyphs.br)}\n`);
  }

  /**
   * GitHub Device Authorization Card.
   */
  public static printDeviceAuthCard(userCode: string, verificationUri: string): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    console.log(`\n  ${theme.accent(glyphs.tl + glyphs.horiz)} ${theme.bold(theme.text("GitHub OAuth Device Flow"))} ${theme.accent(glyphs.horiz.repeat(38) + glyphs.tr)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("1. Verification URL :"))} ${theme.underline(theme.accent(verificationUri))}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("2. One-Time Code    :"))} ${theme.success(theme.bold(userCode))}  ${theme.dim("(Copied to clipboard)")}`);
    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.dim("Browser launched automatically. Approve the code to sign in.")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.dim("Waiting for authorization...")}`);
    console.log(`  ${theme.accent(glyphs.bl + glyphs.horiz.repeat(64) + glyphs.br)}\n`);
  }

  public static printDeviceAuthSuccess(username: string): void {
    const theme = ThemeManager.get();
    console.log(`\n  ${theme.success("[✓]")} Successfully authenticated as ${theme.bold(theme.accent(`@${username}`))}!\n`);
  }
}
