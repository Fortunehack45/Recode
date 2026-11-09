import { ThemeManager } from "./theme.js";

export type ActionCategory =
  | "simmering"
  | "thinking"
  | "reading"
  | "editing"
  | "writing"
  | "executing"
  | "searching"
  | "scanning";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class LiveActionIndicator {
  private static instance: LiveActionIndicator | null = null;
  private currentAction: ActionCategory | null = null;
  private currentDetail = "";
  private startTime = 0;
  private timer: NodeJS.Timeout | null = null;
  private frameIdx = 0;
  private isTTY: boolean;
  private lastRenderedLength = 0;

  private constructor() {
    this.isTTY = !process.env.NO_COLOR && process.stdout.isTTY !== false;
  }

  public static get(): LiveActionIndicator {
    if (!this.instance) {
      this.instance = new LiveActionIndicator();
    }
    return this.instance;
  }

  public startSimmering(): void {
    this.start("simmering", "Simmering...");
  }

  public startThinking(detail = "Reasoning"): void {
    this.start("thinking", detail);
  }

  public updateThinking(snippet: string): void {
    if (this.currentAction === "thinking") {
      const clean = snippet.replace(/\r?\n/g, " ").trim();
      if (clean) {
        this.currentDetail = clean.length > 50 ? clean.slice(0, 47) + "..." : clean;
      }
    }
  }

  public startTool(toolName: string, args: Record<string, unknown> = {}): void {
    const target = String(args.path || args.command || args.query || args.pattern || "");
    const shortTarget = target.length > 45 ? "..." + target.slice(-42) : target;

    const lower = toolName.toLowerCase();
    if (lower.includes("read") || lower.includes("cat")) {
      this.start("reading", `Reading file: ${shortTarget}`);
    } else if (lower.includes("edit") || lower.includes("patch") || lower.includes("modify")) {
      this.start("editing", `Editing file: ${shortTarget}`);
    } else if (lower.includes("write") || lower.includes("create")) {
      this.start("writing", `Writing file: ${shortTarget}`);
    } else if (lower.includes("cmd") || lower.includes("exec") || lower.includes("run") || lower.includes("bash")) {
      this.start("executing", `Executing: ${shortTarget}`);
    } else if (lower.includes("search") || lower.includes("grep") || lower.includes("find")) {
      this.start("searching", `Searching codebase: ${shortTarget}`);
    } else if (lower.includes("list") || lower.includes("dir") || lower.includes("scan")) {
      this.start("scanning", `Scanning directory: ${shortTarget}`);
    } else {
      this.start("executing", `Running ${toolName}: ${shortTarget}`);
    }
  }

  private start(action: ActionCategory, detail: string): void {
    this.stopTimer();
    this.currentAction = action;
    this.currentDetail = detail;
    this.startTime = Date.now();
    this.frameIdx = 0;

    this.render();
    if (this.isTTY) {
      this.timer = setInterval(() => {
        this.frameIdx = (this.frameIdx + 1) % SPINNER_FRAMES.length;
        this.render();
      }, 80);
    }
  }

  public clear(): void {
    this.stopTimer();
    if (this.isTTY && this.lastRenderedLength > 0) {
      process.stdout.write("\r" + " ".repeat(this.lastRenderedLength) + "\r");
      this.lastRenderedLength = 0;
    }
    this.currentAction = null;
    this.currentDetail = "";
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private render(): void {
    if (!this.currentAction) return;

    const theme = ThemeManager.get();
    const frame = this.isTTY ? SPINNER_FRAMES[this.frameIdx] : "*";
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    let label = "";
    let colorFn = theme.accent.bind(theme);

    switch (this.currentAction) {
      case "simmering":
        label = "Simmering...";
        colorFn = theme.secondary.bind(theme);
        break;
      case "thinking":
        label = `Thinking... [${elapsed}s]`;
        colorFn = theme.warning.bind(theme);
        break;
      case "reading":
        label = `Reading file`;
        colorFn = theme.accent.bind(theme);
        break;
      case "editing":
        label = `Editing file`;
        colorFn = theme.secondary.bind(theme);
        break;
      case "writing":
        label = `Writing file`;
        colorFn = theme.success.bind(theme);
        break;
      case "executing":
        label = `Running command`;
        colorFn = theme.warning.bind(theme);
        break;
      case "searching":
        label = `Searching codebase`;
        colorFn = theme.accent.bind(theme);
        break;
      case "scanning":
        label = `Scanning`;
        colorFn = theme.accent.bind(theme);
        break;
    }

    const detailText = this.currentDetail ? ` ${theme.dim(`(${this.currentDetail})`)}` : "";
    const outputLine = `  ${colorFn(frame)} ${colorFn(theme.bold(label))}${detailText}`;

    if (this.isTTY) {
      // Clear line before overwriting
      const cols = process.stdout.columns || 80;
      const stripped = outputLine.replace(/\x1b\[[0-9;]*m/g, "");
      const padding = Math.max(0, this.lastRenderedLength - stripped.length);
      process.stdout.write(`\r${outputLine}${" ".repeat(padding)}`);
      this.lastRenderedLength = stripped.length;
    } else {
      console.log(outputLine);
    }
  }
}
