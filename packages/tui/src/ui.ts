import path from "node:path";
import { ThemeManager, BUILTIN_THEMES, ThemeDefinition } from "./theme.js";
import { FontManager, BORDER_STYLES, BorderStyleType, MascotStyleType } from "./font.js";
import { fitCell, visibleWidth } from "./text.js";
import { AuthStatus, ModelInfo, ChatMessage, ChatMetadata } from "@recode-dev/sdk";

export class UI {
  /**
   * True terminal clearing: wipes visible screen and scrollback buffer.
   */
  public static clearScreen(): void {
    process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
    try {
      console.clear();
    } catch {}
  }

  /**
   * Boxed Pill Badge with rounded border and asterisk bullet.
   */
  public static printBoxedPill(text: string): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;
    const content = `* ${text}`;
    const innerW = visibleWidth(content) + 4;

    console.log(`  ${theme.border(glyphs.tl + glyphs.horiz.repeat(innerW) + glyphs.tr)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent("*")} ${theme.bold(theme.text(text))}  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.bl + glyphs.horiz.repeat(innerW) + glyphs.br)}`);
  }

  public static printPill(text: string): void {
    this.printBoxedPill(text);
  }

  /**
   * Iconic 3D Isometric ASCII Banner matching Claude Code,
   * styled with Recode's high-contrast monochrome theme.
   */
  public static printBanner(version = "1.30.5"): void {
    const theme = ThemeManager.get();
    const bannerLines = [
      "  ██████╗ ███████╗ ██████╗  ██████╗ ██████╗  ███████╗",
      "  ██╔══██╗██╔════╝██╔════╝ ██╔═══██╗██╔══██╗ ██╔════╝",
      "  ██████╔╝█████╗  ██║      ██║   ██║██║  ██║ █████╗  ",
      "  ██╔══██╗██╔══╝  ██║      ██║   ██║██║  ██║ ██╔══╝  ",
      "  ██║  ██║███████╗╚██████╗ ╚██████╔╝██████╔╝ ███████╗",
      "  ╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝  ╚══════╝",
    ];

    console.log();
    for (const line of bannerLines) {
      let rendered = "";
      for (const ch of line) {
        if (ch === "█") {
          rendered += theme.fg(theme.palette.accent)(theme.bold(ch));
        } else if ("╔═╗╚╝║".includes(ch)) {
          rendered += theme.fg("#6e7681")(ch);
        } else {
          rendered += ch;
        }
      }
      console.log(rendered);
    }
    console.log();
  }

  /**
   * Welcome Splash Screen.
   * Pill + 3D Isometric ASCII RECODE Banner + Security Notes.
   * Clears entire scrollback buffer and leaves welcome screen cleanly on display.
   */
  public static printWelcomeSplash(version = "1.30.5", showPrompt = false): void {
    const theme = ThemeManager.get();
    this.clearScreen();
    console.log();
    this.printBoxedPill("Welcome to Recode research preview!");
    this.printBanner(version);
    console.log(`  ${theme.bold(theme.text("Security notes:"))}\n`);
    console.log(`  ${theme.text("1. Recode is currently in research preview")}`);
    console.log(`     ${theme.muted("This beta version may have limitations or unexpected behaviors.")}`);
    console.log(`     ${theme.muted("Run /help at any time to inspect available commands.")}\n`);
    console.log(`  ${theme.text("2. Recode can make mistakes")}`);
    console.log(`     ${theme.muted("You should always review Recode's responses, especially when")}`);
    console.log(`     ${theme.muted("running code.")}\n`);
    console.log(`  ${theme.text("3. Due to prompt injection risks, only use it with code you trust")}`);
    console.log(`     ${theme.muted("For more details see:")}`);
    console.log(`     ${theme.accent("https://github.com/Fortunehack45/Recode#security")}\n`);
    if (showPrompt) {
      console.log(`  ${theme.bold(theme.accent("Press Enter to continue..."))}`);
    }
  }

  /**
   * 2-Column Hero Dashboard Card.
   * Strictly formatted and cell-bounded to exactly 71 chars outer width.
   * Zero overflow, zero wrapping on any 80+ column terminal.
   */
  public static printDashboard(
    status: AuthStatus,
    workspaceDir: string,
    currentModel: string,
    mode: "build" | "plan" = "build",
    version = "1.30.5"
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

    // Left Column: exactly 26 visible chars per cell
    const leftW = 26;
    const mascotLines = font.getMascotLines(theme);

    const leftCol: string[] = [
      theme.bold(theme.text("Welcome to Recode!")),
      "",
      ...(mascotLines.length > 0 ? mascotLines : [""]),
      "",
      `${theme.bold(theme.text("Model:"))} ${theme.accent(fitCell(modelName, 18))}`,
      `${theme.bold(theme.text("Mode :"))} ${modeColored}`,
      `${theme.bold(theme.text("Path :"))} ${theme.muted(fitCell(relPath, 18))}`,
      `${theme.bold(theme.text("User :"))} ${theme.text(fitCell(userBadge, 18))}`,
    ];

    // Right Column: exactly 38 visible chars per cell
    const rightW = 38;

    const rightColTop: string[] = [
      theme.bold(theme.text("Recent Activity")),
      `${theme.muted("1m ago")}   Loaded workspace context`,
      `${theme.muted("8m ago")}   Configured AI providers`,
      `${theme.muted("2d ago")}   Initialized Recode engine`,
      `${theme.muted(".../status for more")}`,
    ];

    const rightColBottom: string[] = [
      theme.bold(theme.text("Quick Actions")),
      `${theme.accent("/theme")}    Change theme (IDE sync)`,
      `${theme.accent("/font")}     Configure borders & mascot`,
      `${theme.accent("/color")}    Customize accent & text`,
      `${theme.accent("/mode")}     Toggle Build vs Plan`,
      `${theme.accent("/connect")}  Connect AI API keys`,
      `${theme.muted(".../help for more")}`,
    ];

    const cardLines: string[] = [];

    // Header border: Exactly 71 visible characters
    // left: tl (1) + horiz (1) + title (22) + horiz.repeat(5) = 29
    // divider: teeTop (1)
    // right: horiz.repeat(40) + tr (1) = 41
    // Total = 29 + 1 + 41 = 71
    const title = ` Recode Agent v${version} `;
    const leftTopBorder =
      glyphs.tl + glyphs.horiz + title + glyphs.horiz.repeat(Math.max(0, leftW + 3 - 2 - visibleWidth(title)));
    const rightTopBorder = glyphs.horiz.repeat(rightW + 2) + glyphs.tr;
    cardLines.push("  " + theme.cardBorder(leftTopBorder + glyphs.teeTop + rightTopBorder));

    // Top Section rows
    const topRows = Math.max(5, rightColTop.length);
    for (let i = 0; i < topRows; i++) {
      const leftCell = fitCell(leftCol[i] || "", leftW);
      const rightCell = fitCell(rightColTop[i] || "", rightW);
      cardLines.push(
        "  " +
          theme.border(glyphs.vert) +
          " " +
          leftCell +
          " " +
          theme.border(glyphs.vert) +
          " " +
          rightCell +
          " " +
          theme.border(glyphs.vert)
      );
    }

    // Divider between Recent Activity and Quick Actions
    // left: vert (1) + " " (1) + cell (26) + " " (1) = 29
    // divider: teeLeft (1)
    // right: horiz.repeat(40) + teeRight (1) = 41
    // Total = 71
    const leftMidCell = fitCell(leftCol[topRows] || "", leftW);
    cardLines.push(
      "  " +
        theme.border(glyphs.vert) +
        " " +
        leftMidCell +
        " " +
        theme.border(glyphs.teeLeft + glyphs.horiz.repeat(rightW + 2) + glyphs.teeRight)
    );

    // Bottom Section rows
    const botRows = Math.max(leftCol.length - topRows - 1, rightColBottom.length);
    for (let i = 0; i < botRows; i++) {
      const leftCell = fitCell(leftCol[topRows + 1 + i] || "", leftW);
      const rightCell = fitCell(rightColBottom[i] || "", rightW);
      cardLines.push(
        "  " +
          theme.border(glyphs.vert) +
          " " +
          leftCell +
          " " +
          theme.border(glyphs.vert) +
          " " +
          rightCell +
          " " +
          theme.border(glyphs.vert)
      );
    }

    // Footer border: Exactly 71 visible characters
    // bl (1) + horiz.repeat(28) + teeBottom (1) + horiz.repeat(40) + br (1) = 71
    cardLines.push(
      "  " +
        theme.cardBorder(
          glyphs.bl +
            glyphs.horiz.repeat(leftW + 2) +
            glyphs.teeBottom +
            glyphs.horiz.repeat(rightW + 2) +
            glyphs.br
        )
    );

    console.log(cardLines.join("\n") + "\n");
  }

  /**
   * Ready status checks.
   */
  public static printReadyChecks(
    sessionId: string,
    model = "gemini-2.5-flash",
    mode: "build" | "plan" = "build"
  ): void {
    const theme = ThemeManager.get();
    const modeBadge =
      mode === "build"
        ? theme.fg(theme.palette.success)(theme.bold("[BUILD]"))
        : theme.fg(theme.palette.secondary)(theme.bold("[PLAN]"));

    console.log(`  ${theme.success("[✓]")} Recode engine: ${theme.bold("ready")}  ${theme.border("·")}  ${theme.accent(model)}  ${theme.border("·")}  ${modeBadge}`);
    console.log(`  ${theme.dim("Tips: /help commands  •  @file context  •  Shift+Tab mode  •  /dashboard")}\n`);
  }

  /**
   * Main welcome page header.
   * Pill + 3D Isometric RECODE Banner. Clean, iconic, zero list clutter.
   */
  public static printHeader(
    _status?: AuthStatus,
    _workspaceDir?: string,
    _currentModel?: string,
    _mode: "build" | "plan" = "build",
    _version = "1.30.5",
    _sessionId = "session_main"
  ): void {
    console.log();
    this.printBoxedPill("Welcome to Recode research preview!");
    this.printBanner();
  }

  /**
   * User message container.
   * Sleek 73-character framed card with clean wrap and distinct user header.
   */
  public static printUserMessage(prompt: string): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    const innerW = 69;
    const title = " You ";
    const topBorder =
      "  " +
      theme.border(glyphs.tl + glyphs.horiz) +
      theme.bold(theme.accent(title)) +
      theme.border(glyphs.horiz.repeat(Math.max(0, innerW - 1 - visibleWidth(title))) + glyphs.tr);

    // Word wrap prompt to lines of at most 65 characters
    const words = prompt.trim().split(/\s+/);
    const wrappedLines: string[] = [];
    let currentLine = "";

    for (const w of words) {
      if (!currentLine) {
        currentLine = w;
      } else if (visibleWidth(currentLine + " " + w) <= 65) {
        currentLine += " " + w;
      } else {
        wrappedLines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
    if (wrappedLines.length === 0) wrappedLines.push("");

    const contentLines = wrappedLines.map(
      (line) =>
        "  " +
        theme.border(glyphs.vert) +
        " " +
        fitCell(theme.bold(theme.text(line)), 67) +
        " " +
        theme.border(glyphs.vert)
    );

    const botBorder =
      "  " +
      theme.border(glyphs.bl + glyphs.horiz.repeat(innerW) + glyphs.br);

    console.log();
    console.log(topBorder);
    console.log(contentLines.join("\n"));
    console.log(botBorder);
    console.log();
  }

  /**
   * Assistant container header.
   */
  public static printAssistantStart(model?: string): void {
    const theme = ThemeManager.get();
    const modelBadge = model ? `  ${theme.dim("·")}  ${theme.dim(model)}` : "";
    console.log(`  ${theme.accent("◆")} ${theme.bold(theme.text("Recode"))}${modelBadge}\n`);
  }

  public static printAssistantEnd(): void {
    console.log();
  }

  /**
   * Conversation History Viewer (/history).
   */
  public static printHistory(messages: ChatMessage[]): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    const visibleMsgs = messages.filter((m) => m.role !== "system");
    if (visibleMsgs.length === 0) {
      console.log(`\n  ${theme.dim("No conversation history in this session yet.")}\n`);
      return;
    }

    const title = ` History (${visibleMsgs.length} messages) `;
    const innerW = 69;
    const topBorder =
      "  " +
      theme.accent(glyphs.tl + glyphs.horiz) +
      theme.bold(theme.text(title)) +
      theme.accent(glyphs.horiz.repeat(Math.max(0, innerW - 1 - visibleWidth(title))) + glyphs.tr);

    console.log();
    console.log(topBorder);

    let turn = 1;
    for (const msg of visibleMsgs) {
      const isUser = msg.role === "user";
      const roleLabel = isUser
        ? theme.accent(theme.bold(`Turn #${turn++} [You]`))
        : theme.fg(theme.palette.success)(theme.bold(`Turn #${turn++} [Recode]`));

      console.log(`  ${theme.border(glyphs.vert)}  ${roleLabel}`);

      const content = msg.content || "";
      const lines = content.split(/\r?\n/).slice(0, 3);
      for (const l of lines) {
        const truncated = l.length > 63 ? l.slice(0, 60) + "..." : l;
        console.log(`  ${theme.border(glyphs.vert)}    ${theme.text(fitCell(truncated, 63))}`);
      }
      if (content.split(/\r?\n/).length > 3) {
        console.log(`  ${theme.border(glyphs.vert)}    ${theme.dim("...")}`);
      }
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const toolNames = msg.tool_calls
          .map((t) => (t as any).name || (t as any).function?.name || "tool")
          .join(", ");
        console.log(`  ${theme.border(glyphs.vert)}    ${theme.dim(`Tools: ${toolNames}`)}`);
      }
      console.log(`  ${theme.border(glyphs.vert)}`);
    }

    const botBorder =
      "  " + theme.accent(glyphs.bl + glyphs.horiz.repeat(innerW) + glyphs.br);
    console.log(botBorder);
    console.log();
  }

  /**
   * Saved Chat Sessions List (/chats).
   */
  public static printChatList(chats: ChatMetadata[], activeId?: string): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    const innerW = 69;
    const title = ` Saved Chat Sessions (${chats.length}) `;
    const topBorder =
      "  " +
      theme.accent(glyphs.tl + glyphs.horiz) +
      theme.bold(theme.text(title)) +
      theme.accent(glyphs.horiz.repeat(Math.max(0, innerW - 1 - visibleWidth(title))) + glyphs.tr);

    console.log();
    console.log(topBorder);

    if (chats.length === 0) {
      console.log(`  ${theme.border(glyphs.vert)}  ${theme.dim("No saved chat sessions found.")}`);
    } else {
      for (let i = 0; i < chats.length; i++) {
        const c = chats[i];
        const isActive = c.id === activeId;
        const marker = isActive ? theme.accent("[*]") : theme.dim(`[${i + 1}]`);
        const titleSnippet = c.title.length > 28 ? c.title.slice(0, 25) + "..." : c.title;
        const turns = `${c.messageCount} msg${c.messageCount === 1 ? "" : "s"}`;
        const activeLabel = isActive ? theme.accent(" (Active)") : "";

        console.log(
          `  ${theme.border(glyphs.vert)}  ${marker} ${theme.bold(theme.text(fitCell(titleSnippet, 28)))} ` +
            `${theme.dim(fitCell(turns, 8))} ${theme.muted(fitCell(c.id.slice(0, 16), 16))}${activeLabel}`
        );
      }
    }

    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Start new chat :"))} ${theme.accent("/new")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Resume a chat  :"))} ${theme.accent("/chat <id | #number>")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Compact turns  :"))} ${theme.accent("/compact")}`);

    const botBorder =
      "  " + theme.accent(glyphs.bl + glyphs.horiz.repeat(innerW) + glyphs.br);
    console.log(botBorder);
    console.log();
  }

  /**
   * Collaboration Channels Card (/channel).
   */
  public static printChannelCard(status: {
    connected: boolean;
    roomId: string | null;
    serverUrl: string;
  }): void {
    const theme = ThemeManager.get();
    const font = FontManager.get();
    const glyphs = font.glyphs;

    const innerW = 69;
    const title = " Recode Real-Time Collaboration ";
    const topBorder =
      "  " +
      theme.accent(glyphs.tl + glyphs.horiz) +
      theme.bold(theme.text(title)) +
      theme.accent(glyphs.horiz.repeat(Math.max(0, innerW - 1 - visibleWidth(title))) + glyphs.tr);

    console.log();
    console.log(topBorder);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Server :"))} ${theme.accent(status.serverUrl)}`);
    const statusPill = status.connected
      ? theme.success("[✓] Online (Connected)")
      : theme.dim("[○] Standby (Fly.io Global Edge)");
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Status :"))} ${statusPill}`);
    console.log(
      `  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Room   :"))} ${
        status.roomId ? theme.accent(theme.bold(status.roomId)) : theme.dim("None (solo mode)")
      }`
    );
    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Join room      :"))} ${theme.accent("/channel join <room_name>")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Leave room     :"))} ${theme.accent("/channel leave")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Channel status :"))} ${theme.accent("/channel status")}`);

    const botBorder =
      "  " + theme.accent(glyphs.bl + glyphs.horiz.repeat(innerW) + glyphs.br);
    console.log(botBorder);
    console.log();
  }

  /**
   * Thinking summary / thought pill.
   */
  public static printThinkingSummary(durationSeconds: number): void {
    const theme = ThemeManager.get();
    console.log(`  ${theme.dim(`› Thought for ${durationSeconds.toFixed(1)}s`)}\n`);
  }

  public static printThinkingBlock(reasoning: string, durationSeconds?: number): void {
    const theme = ThemeManager.get();
    const durStr = durationSeconds !== undefined ? ` (${durationSeconds.toFixed(1)}s)` : "";
    const firstLine = reasoning.trim().split("\n")[0] || "";
    const preview = firstLine.length > 55 ? firstLine.slice(0, 52) + "..." : firstLine;
    console.log(`  ${theme.dim(`› Thought${durStr}:`)} ${theme.muted(preview)}\n`);
  }

  /**
   * Compact, professional tool completion line.
   * Clean, single-line, informative, not stuffy!
   */
  public static printToolEnd(
    toolName: string,
    success: boolean,
    output: string,
    error?: string,
    durationMs?: number
  ): void {
    const theme = ThemeManager.get();
    const timeStr = durationMs !== undefined ? ` ${theme.dim(`(${durationMs}ms)`)}` : "";

    if (success) {
      let preview = output.replace(/\r?\n/g, " ").trim();
      if (preview.length > 48) preview = preview.slice(0, 45) + "...";
      const lineCount = output ? output.split("\n").length : 0;
      const countBadge = lineCount > 1 ? ` ${theme.dim(`[${lineCount} lines]`)}` : "";
      console.log(`  ${theme.success("●")} ${theme.bold(theme.text(toolName))}${countBadge}${preview ? " " + theme.dim(preview) : ""}${timeStr}`);
    } else {
      console.log(`  ${theme.error("✗")} ${theme.error(theme.bold(toolName))}: ${theme.error(error || "Execution failed")}${timeStr}`);
    }
  }

  /**
   * Turn summary dock.
   */
  public static printTurnSummary(durationSeconds: number, tokens?: number): void {
    const theme = ThemeManager.get();
    const tokStr = tokens ? ` · ${tokens.toLocaleString()} tokens` : "";
    console.log(`  ${theme.dim(`✓ Done in ${durationSeconds.toFixed(1)}s${tokStr}`)}\n`);
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

      const namePadded = fitCell(def.name, 18);
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

    for (const style of ["rounded", "dotted", "sharp", "double", "minimal"] as BorderStyleType[]) {
      const g = BORDER_STYLES[style];
      const isCur = font.currentBorderStyle === style;
      const sample = `${g.tl}${g.horiz}${g.horiz}${g.tr}  ${g.vert}  ${g.bl}${g.horiz}${g.horiz}${g.br}`;
      const marker = isCur ? theme.accent("[*]") : theme.dim("[ ]");
      console.log(`  ${theme.border(glyphs.vert)}    ${marker} ${fitCell(style, 10)} ${theme.accent(sample)}${isCur ? theme.accent(" (Active)") : ""}`);
    }

    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Mascot Styles:"))}`);
    for (const m of ["robot", "mini", "off"] as MascotStyleType[]) {
      const isCur = font.currentMascotStyle === m;
      const marker = isCur ? theme.accent("[*]") : theme.dim("[ ]");
      console.log(`  ${theme.border(glyphs.vert)}    ${marker} ${fitCell(m, 10)}${isCur ? theme.accent(" (Active)") : ""}`);
    }

    console.log(`  ${theme.border(glyphs.vert)}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Change border style:"))} ${theme.accent("/font style <rounded|dotted|sharp|double>")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.bold(theme.text("Change mascot art  :"))} ${theme.accent("/font mascot <robot|mini|off>")}`);
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
      console.log(`  ${theme.border(glyphs.vert)}  ${fitCell(item.name, 16)} ${swatch}  ${theme.muted(item.hex)}`);
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
      { cmd: "/welcome", desc: "Show onboarding welcome & security preview splash" },
      { cmd: "/clear", desc: "Clear terminal viewport & reset active conversation" },
      { cmd: "/new", desc: "Start fresh chat session (auto-saves current session)" },
      { cmd: "/history", desc: "View conversation turns for active session" },
      { cmd: "/chats", desc: "List all saved chat sessions" },
      { cmd: "/chat <id|#>", desc: "Resume saved chat session by ID or index" },
      { cmd: "/compact", desc: "Prune and compact conversation context tokens" },
      { cmd: "/channel [room]", desc: "Team collaboration channels (wss://recode-collab)" },
      { cmd: "/model [name]", desc: "Switch AI model (e.g. opencode-recode, gemini-2.5-flash)" },
      { cmd: "/models", desc: "List all supported models across all providers" },
      { cmd: "/connect [p] [k]", desc: "Set API keys (OpenCode, Gemini, OpenAI, Claude)" },
      { cmd: "/mode [build|plan]", desc: "Toggle Build (read/write/exec) vs Plan (read-only)" },
      { cmd: "/theme [name|ide]", desc: "Browse or switch themes (matches Recode IDE)" },
      { cmd: "/font [style|mascot]", desc: "Configure border styles (dotted/rounded) & mascot" },
      { cmd: "/color [accent|hex]", desc: "Inspect theme color palette or set custom accent" },
      { cmd: "/status", desc: "Show Git status in current workspace" },
      { cmd: "/diff", desc: "Show pending Git diff changes" },
      { cmd: "!<command>", desc: "Execute shell command directly (e.g. !cargo test)" },
      { cmd: "@<path>", desc: "Attach file context into prompt (e.g. @src/index.ts)" },
      { cmd: "Shift+Tab", desc: "Instant hotkey to toggle Build vs Plan mode" },
      { cmd: "Ctrl+V", desc: "Paste from system clipboard into input prompt" },
      { cmd: "/exit", desc: "Quit Recode terminal assistant" },
    ];

    for (const c of cmds) {
      console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(fitCell(c.cmd, 24))} ${theme.dim(c.desc)}`);
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
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[1] OpenCode API"))}     ${theme.dim("opencode-recode, opencode-go, glm-5, deepseek, sonnet")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[2] Google Gemini"))}     ${theme.dim("gemini-2.5-flash, gemini-2.5-pro (Generous free tier, 1M ctx)")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[3] OpenAI"))}            ${theme.dim("gpt-4o, gpt-4o-mini, o3-mini")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[4] Anthropic Claude"))}  ${theme.dim("claude-3-7-sonnet, claude-3-5-sonnet")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[5] DeepSeek"))}          ${theme.dim("deepseek-chat (V3), deepseek-reasoner (R1)")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[6] Groq"))}              ${theme.dim("llama-3.3-70b (Ultra-fast LPUs)")}`);
    console.log(`  ${theme.border(glyphs.vert)}  ${theme.accent(theme.bold("[7] Ollama (Local)"))}    ${theme.dim("100% private & offline models on your machine")}`);
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

      console.log(`  ${theme.border(glyphs.vert)}  ${marker} ${theme.bold(theme.text(fitCell(id, 22)))} ${statusPill} ${theme.muted(m.provider)}`);
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
