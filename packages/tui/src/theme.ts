import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ThemePalette {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  secondary: string;
  border: string;
  cardBorder: string;
  inputBg: string;
  mascot: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  appearance: "dark" | "light";
  description: string;
  palette: ThemePalette;
}

export interface TerminalConfig {
  theme?: string;
  borderStyle?: "dotted" | "rounded" | "sharp" | "double" | "minimal";
  mascotStyle?: "retro" | "robot" | "mini" | "off";
  fontFamily?: string;
  fontSize?: number;
  customAccent?: string;
  syncWithIde?: boolean;
}

export const BUILTIN_THEMES: Record<string, ThemeDefinition> = {
  "ayu-dark": {
    id: "ayu-dark",
    name: "Ayu Dark",
    appearance: "dark",
    description: "Recode IDE Ayu Dark theme with sky blue accents and warm golden highlights",
    palette: {
      bg: "#0f1419",
      fg: "#e6e1cf",
      muted: "#8a8986",
      accent: "#5ac1fe",
      secondary: "#ffb454",
      border: "#3f4043",
      cardBorder: "#5ac1fe",
      inputBg: "#1f2127",
      mascot: "#5ac1fe",
      success: "#7fd962",
      warning: "#ffb454",
      error: "#f07178",
    },
  },
  "ayu-mirage": {
    id: "ayu-mirage",
    name: "Ayu Mirage",
    appearance: "dark",
    description: "Deep bluish twilight palette with bright sky highlights",
    palette: {
      bg: "#1f2430",
      fg: "#cbccc6",
      muted: "#70748c",
      accent: "#73d0ff",
      secondary: "#ffcc66",
      border: "#33384c",
      cardBorder: "#73d0ff",
      inputBg: "#242936",
      mascot: "#73d0ff",
      success: "#87d96c",
      warning: "#ffcc66",
      error: "#f28779",
    },
  },
  "ayu-light": {
    id: "ayu-light",
    name: "Ayu Light",
    appearance: "light",
    description: "Clean paper-white light theme with vivid blue accents",
    palette: {
      bg: "#fafafa",
      fg: "#5c6166",
      muted: "#8a9199",
      accent: "#399ee6",
      secondary: "#fa8d3e",
      border: "#e1e4e8",
      cardBorder: "#399ee6",
      inputBg: "#f0f2f5",
      mascot: "#399ee6",
      success: "#86b300",
      warning: "#fa8d3e",
      error: "#f05656",
    },
  },
  "one-dark": {
    id: "one-dark",
    name: "One Dark",
    appearance: "dark",
    description: "Recode IDE standard One Dark theme with balanced pastel tones",
    palette: {
      bg: "#282c34",
      fg: "#abb2bf",
      muted: "#5c6370",
      accent: "#61afef",
      secondary: "#98c379",
      border: "#464b57",
      cardBorder: "#61afef",
      inputBg: "#2f343e",
      mascot: "#61afef",
      success: "#98c379",
      warning: "#e5c07b",
      error: "#e06c75",
    },
  },
  "one-light": {
    id: "one-light",
    name: "One Light",
    appearance: "light",
    description: "Crisp light theme matching One Light in Recode IDE",
    palette: {
      bg: "#fafafa",
      fg: "#383a42",
      muted: "#a0a1a7",
      accent: "#4078f2",
      secondary: "#50a14f",
      border: "#d0d0d0",
      cardBorder: "#4078f2",
      inputBg: "#f0f0f0",
      mascot: "#4078f2",
      success: "#50a14f",
      warning: "#c18401",
      error: "#e45649",
    },
  },
  "gruvbox-dark": {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    appearance: "dark",
    description: "Classic retro groove theme with warm amber and orange tones",
    palette: {
      bg: "#282828",
      fg: "#ebdbb2",
      muted: "#928374",
      accent: "#fe8019",
      secondary: "#fabd2f",
      border: "#504945",
      cardBorder: "#fe8019",
      inputBg: "#3c3836",
      mascot: "#fe8019",
      success: "#b8bb26",
      warning: "#fabd2f",
      error: "#fb4934",
    },
  },
  "gruvbox-dark-soft": {
    id: "gruvbox-dark-soft",
    name: "Gruvbox Dark Soft",
    appearance: "dark",
    description: "Subdued warm contrast Gruvbox theme",
    palette: {
      bg: "#32302f",
      fg: "#ebdbb2",
      muted: "#928374",
      accent: "#d65d0e",
      secondary: "#d79921",
      border: "#504945",
      cardBorder: "#d65d0e",
      inputBg: "#3c3836",
      mascot: "#d65d0e",
      success: "#98971a",
      warning: "#d79921",
      error: "#cc241d",
    },
  },
  "gruvbox-light": {
    id: "gruvbox-light",
    name: "Gruvbox Light",
    appearance: "light",
    description: "Parchment warm light theme with vintage terracotta accents",
    palette: {
      bg: "#fbf1c7",
      fg: "#3c3836",
      muted: "#928374",
      accent: "#af3a03",
      secondary: "#b57614",
      border: "#d5c4a1",
      cardBorder: "#af3a03",
      inputBg: "#ebdbb2",
      mascot: "#af3a03",
      success: "#79740e",
      warning: "#b57614",
      error: "#9d0006",
    },
  },
  "recode-dark": {
    id: "recode-dark",
    name: "Recode Dark",
    appearance: "dark",
    description: "Recode signature obsidian palette with electric cyan & neon magenta",
    palette: {
      bg: "#111216",
      fg: "#f1f5f9",
      muted: "#64748b",
      accent: "#00f0ff",
      secondary: "#ec4899",
      border: "#27272a",
      cardBorder: "#00f0ff",
      inputBg: "#18181b",
      mascot: "#00f0ff",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
  "claude-warm": {
    id: "claude-warm",
    name: "Claude Warm",
    appearance: "dark",
    description: "Anthropic Claude Code aesthetic with dark charcoal & warm terracotta",
    palette: {
      bg: "#1f1e1d",
      fg: "#f4f0eb",
      muted: "#a8a29e",
      accent: "#e06c53",
      secondary: "#d97706",
      border: "#44403c",
      cardBorder: "#e06c53",
      inputBg: "#292524",
      mascot: "#e06c53",
      success: "#84cc16",
      warning: "#d97706",
      error: "#ef4444",
    },
  },
  "dracula": {
    id: "dracula",
    name: "Dracula",
    appearance: "dark",
    description: "Classic dark vampire theme with vibrant purple and cyan highlights",
    palette: {
      bg: "#282a36",
      fg: "#f8f8f2",
      muted: "#6272a4",
      accent: "#bd93f9",
      secondary: "#ff79c6",
      border: "#44475a",
      cardBorder: "#bd93f9",
      inputBg: "#343746",
      mascot: "#bd93f9",
      success: "#50fa7b",
      warning: "#f1fa8c",
      error: "#ff5555",
    },
  },
  "nord": {
    id: "nord",
    name: "Nord",
    appearance: "dark",
    description: "Arctic, north-bluish palette with cold, clear contrasts",
    palette: {
      bg: "#2e3440",
      fg: "#eceff4",
      muted: "#616e88",
      accent: "#88c0d0",
      secondary: "#81a1c1",
      border: "#434c5e",
      cardBorder: "#88c0d0",
      inputBg: "#3b4252",
      mascot: "#88c0d0",
      success: "#a3be8c",
      warning: "#ebcb8b",
      error: "#bf616a",
    },
  },
  "tokyo-night": {
    id: "tokyo-night",
    name: "Tokyo Night",
    appearance: "dark",
    description: "Celebrates the lights of Downtown Tokyo at night",
    palette: {
      bg: "#1a1b26",
      fg: "#c0caf5",
      muted: "#565f89",
      accent: "#7aa2f7",
      secondary: "#bb9af7",
      border: "#292e42",
      cardBorder: "#7aa2f7",
      inputBg: "#24283b",
      mascot: "#7aa2f7",
      success: "#9ece6a",
      warning: "#e0af68",
      error: "#f7768e",
    },
  },
};

export class ThemeManager {
  private static instance: ThemeManager | null = null;
  private currentTheme: ThemeDefinition;
  private customAccent: string | null = null;
  private isTTY: boolean;
  private isTrueColor: boolean;

  private constructor() {
    this.isTTY = !process.env.NO_COLOR && process.stdout.isTTY !== false;
    this.isTrueColor = this.detectTrueColor();
    this.currentTheme = this.resolveInitialTheme();
  }

  public static get(): ThemeManager {
    if (!this.instance) {
      this.instance = new ThemeManager();
    }
    return this.instance;
  }

  private detectTrueColor(): boolean {
    if (process.env.COLORTERM === "truecolor" || process.env.COLORTERM === "24bit") {
      return true;
    }
    if (process.platform === "win32") {
      return Boolean(process.env.WT_SESSION || process.env.TERM_PROGRAM === "vscode");
    }
    return Boolean(process.env.TERM?.includes("256color") || process.env.TERM_PROGRAM);
  }

  public static getConfigDir(): string {
    const custom = process.env.RECODE_CONFIG_DIR;
    if (custom) return custom;

    const home = os.homedir();
    if (process.platform === "win32") {
      const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
      return path.join(appData, "Recode");
    }
    return path.join(home, ".config", "recode");
  }

  public static getTerminalConfigPath(): string {
    return path.join(this.getConfigDir(), "terminal.json");
  }

  public static getIdeSettingsPath(): string {
    return path.join(this.getConfigDir(), "settings.json");
  }

  public static loadConfig(): TerminalConfig {
    const configPath = this.getTerminalConfigPath();
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
    } catch {}
    return {};
  }

  public static saveConfig(cfg: Partial<TerminalConfig>): void {
    const configDir = this.getConfigDir();
    const configPath = this.getTerminalConfigPath();
    try {
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      const existing = this.loadConfig();
      const updated = { ...existing, ...cfg };
      fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf-8");
    } catch {}
  }

  /**
   * Inspect Recode IDE settings.json to detect active theme.
   */
  public static detectIdeTheme(): string | null {
    const idePath = this.getIdeSettingsPath();
    try {
      if (fs.existsSync(idePath)) {
        const raw = fs.readFileSync(idePath, "utf-8");
        // Strip comments if present
        const cleaned = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
        const parsed = JSON.parse(cleaned);

        if (parsed.theme) {
          if (typeof parsed.theme === "string") {
            return parsed.theme;
          }
          if (typeof parsed.theme === "object") {
            const mode = parsed.theme.mode || "dark";
            return mode === "light" ? parsed.theme.light : parsed.theme.dark;
          }
        }
      }
    } catch {}
    return null;
  }

  /**
   * Map IDE theme names (e.g. "Ayu Dark", "Gruvbox Dark Soft") to theme id.
   */
  public static normalizeThemeId(name: string): string {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").trim();
    if (BUILTIN_THEMES[clean]) return clean;

    for (const [id, def] of Object.entries(BUILTIN_THEMES)) {
      if (def.name.toLowerCase() === name.toLowerCase()) return id;
    }

    if (clean.includes("ayu")) {
      if (clean.includes("light")) return "ayu-light";
      if (clean.includes("mirage")) return "ayu-mirage";
      return "ayu-dark";
    }
    if (clean.includes("gruvbox")) {
      if (clean.includes("light")) return "gruvbox-light";
      if (clean.includes("soft")) return "gruvbox-dark-soft";
      return "gruvbox-dark";
    }
    if (clean.includes("one")) {
      if (clean.includes("light")) return "one-light";
      return "one-dark";
    }
    if (clean.includes("claude")) return "claude-warm";
    if (clean.includes("dracula")) return "dracula";
    if (clean.includes("nord")) return "nord";

    return "ayu-dark";
  }

  private resolveInitialTheme(): ThemeDefinition {
    const config = ThemeManager.loadConfig();
    if (config.customAccent) {
      this.customAccent = config.customAccent;
    }

    // 1. Explicit terminal config choice
    if (config.theme && BUILTIN_THEMES[config.theme]) {
      return BUILTIN_THEMES[config.theme];
    }

    // 2. Synced from Recode IDE settings.json
    const ideTheme = ThemeManager.detectIdeTheme();
    if (ideTheme) {
      const resolvedId = ThemeManager.normalizeThemeId(ideTheme);
      if (BUILTIN_THEMES[resolvedId]) {
        return BUILTIN_THEMES[resolvedId];
      }
    }

    // 3. Default to Ayu Dark (user's active IDE theme)
    return BUILTIN_THEMES["ayu-dark"];
  }

  public get theme(): ThemeDefinition {
    return this.currentTheme;
  }

  public get palette(): ThemePalette {
    if (this.customAccent) {
      return {
        ...this.currentTheme.palette,
        accent: this.customAccent,
        cardBorder: this.customAccent,
        mascot: this.customAccent,
      };
    }
    return this.currentTheme.palette;
  }

  public setTheme(id: string, options: { syncIde?: boolean } = {}): boolean {
    const normalized = ThemeManager.normalizeThemeId(id);
    const found = BUILTIN_THEMES[normalized];
    if (!found) return false;

    this.currentTheme = found;
    ThemeManager.saveConfig({ theme: normalized, syncWithIde: options.syncIde });

    if (options.syncIde) {
      this.syncIdeSettings(found.name, found.appearance);
    }
    return true;
  }

  public setCustomAccent(color: string | null): void {
    this.customAccent = color;
    ThemeManager.saveConfig({ customAccent: color || undefined });
  }

  private syncIdeSettings(themeName: string, appearance: "dark" | "light"): void {
    const idePath = ThemeManager.getIdeSettingsPath();
    try {
      if (fs.existsSync(idePath)) {
        const raw = fs.readFileSync(idePath, "utf-8");
        const cleaned = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
        const parsed = JSON.parse(cleaned);

        if (!parsed.theme || typeof parsed.theme === "string") {
          parsed.theme = {
            mode: appearance,
            dark: appearance === "dark" ? themeName : parsed.theme || "Ayu Dark",
            light: appearance === "light" ? themeName : "Gruvbox Light Soft",
          };
        } else {
          parsed.theme.mode = appearance;
          if (appearance === "dark") parsed.theme.dark = themeName;
          else parsed.theme.light = themeName;
        }

        fs.writeFileSync(idePath, JSON.stringify(parsed, null, 2), "utf-8");
      }
    } catch {}
  }

  // --- Color Rendering Helpers ---

  public hexToRgb(hex: string): [number, number, number] {
    let clean = hex.replace("#", "").trim();
    if (clean.length === 8) clean = clean.slice(0, 6);
    if (clean.length === 3) {
      clean = clean
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  public fg(hex: string): (str: string) => string {
    if (!this.isTTY) return (str: string) => str;
    const [r, g, b] = this.hexToRgb(hex);
    return (str: string) => `\x1b[38;2;${r};${g};${b}m${str}\x1b[39m`;
  }

  public bg(hex: string): (str: string) => string {
    if (!this.isTTY) return (str: string) => str;
    const [r, g, b] = this.hexToRgb(hex);
    return (str: string) => `\x1b[48;2;${r};${g};${b}m${str}\x1b[49m`;
  }

  public bold(str: string): string {
    return this.isTTY ? `\x1b[1m${str}\x1b[22m` : str;
  }

  public dim(str: string): string {
    return this.isTTY ? `\x1b[2m${str}\x1b[22m` : str;
  }

  public italic(str: string): string {
    return this.isTTY ? `\x1b[3m${str}\x1b[23m` : str;
  }

  public underline(str: string): string {
    return this.isTTY ? `\x1b[4m${str}\x1b[24m` : str;
  }

  // Active theme styled helpers
  public text(str: string): string {
    return this.fg(this.palette.fg)(str);
  }

  public muted(str: string): string {
    return this.fg(this.palette.muted)(str);
  }

  public accent(str: string): string {
    return this.fg(this.palette.accent)(str);
  }

  public secondary(str: string): string {
    return this.fg(this.palette.secondary)(str);
  }

  public border(str: string): string {
    return this.fg(this.palette.border)(str);
  }

  public cardBorder(str: string): string {
    return this.fg(this.palette.cardBorder)(str);
  }

  public mascot(str: string): string {
    return this.fg(this.palette.mascot)(str);
  }

  public success(str: string): string {
    return this.fg(this.palette.success)(str);
  }

  public warning(str: string): string {
    return this.fg(this.palette.warning)(str);
  }

  public error(str: string): string {
    return this.fg(this.palette.error)(str);
  }

  public badge(label: string, hexColor?: string): string {
    const col = hexColor ? this.fg(hexColor) : this.accent;
    return `${col("[")} ${this.bold(label)} ${col("]")}`;
  }

  public pill(label: string, hexColor?: string): string {
    const col = hexColor ? this.fg(hexColor) : this.accent;
    return `${col("*")} ${this.bold(label)}`;
  }
}
