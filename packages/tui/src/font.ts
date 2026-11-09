import { ThemeManager } from "./theme.js";

export type BorderStyleType = "dotted" | "rounded" | "sharp" | "double" | "minimal";
export type MascotStyleType = "retro" | "robot" | "mini" | "off";

export interface BorderGlyphs {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  horiz: string;
  vert: string;
  teeLeft: string;
  teeRight: string;
  teeTop: string;
  teeBottom: string;
  cross: string;
}

export const BORDER_STYLES: Record<BorderStyleType, BorderGlyphs> = {
  dotted: {
    tl: "╭",
    tr: "╮",
    bl: "╰",
    br: "╯",
    horiz: "┄",
    vert: "┆",
    teeLeft: "├",
    teeRight: "┤",
    teeTop: "┬",
    teeBottom: "┴",
    cross: "┼",
  },
  rounded: {
    tl: "╭",
    tr: "╮",
    bl: "╰",
    br: "╯",
    horiz: "─",
    vert: "│",
    teeLeft: "├",
    teeRight: "┤",
    teeTop: "┬",
    teeBottom: "┴",
    cross: "┼",
  },
  sharp: {
    tl: "┌",
    tr: "┐",
    bl: "└",
    br: "┘",
    horiz: "─",
    vert: "│",
    teeLeft: "├",
    teeRight: "┤",
    teeTop: "┬",
    teeBottom: "┴",
    cross: "┼",
  },
  double: {
    tl: "╔",
    tr: "╗",
    bl: "╚",
    br: "╝",
    horiz: "═",
    vert: "║",
    teeLeft: "╠",
    teeRight: "╣",
    teeTop: "╦",
    teeBottom: "╩",
    cross: "╬",
  },
  minimal: {
    tl: "┌",
    tr: "┐",
    bl: "└",
    br: "┘",
    horiz: "─",
    vert: "│",
    teeLeft: "├",
    teeRight: "┤",
    teeTop: "┬",
    teeBottom: "┴",
    cross: "┼",
  },
};

export class FontManager {
  private static instance: FontManager | null = null;
  private borderStyle: BorderStyleType = "rounded";
  private mascotStyle: MascotStyleType = "robot";
  private fontFamily: string | null = null;
  private fontSize: number | null = null;

  private constructor() {
    this.loadPreferences();
  }

  public static get(): FontManager {
    if (!this.instance) {
      this.instance = new FontManager();
    }
    return this.instance;
  }

  private loadPreferences(): void {
    const config = ThemeManager.loadConfig();
    if (config.borderStyle && BORDER_STYLES[config.borderStyle]) {
      this.borderStyle = config.borderStyle;
    }
    if (config.mascotStyle) {
      this.mascotStyle = config.mascotStyle === "retro" ? "robot" : config.mascotStyle;
    }
    if (config.fontFamily) {
      this.fontFamily = config.fontFamily;
    }
    if (config.fontSize) {
      this.fontSize = config.fontSize;
    }
  }

  public get glyphs(): BorderGlyphs {
    return BORDER_STYLES[this.borderStyle] || BORDER_STYLES.rounded;
  }

  public get currentBorderStyle(): BorderStyleType {
    return this.borderStyle;
  }

  public get currentMascotStyle(): MascotStyleType {
    return this.mascotStyle;
  }

  public setBorderStyle(style: BorderStyleType): void {
    if (BORDER_STYLES[style]) {
      this.borderStyle = style;
      ThemeManager.saveConfig({ borderStyle: style });
    }
  }

  public setMascotStyle(mascot: MascotStyleType): void {
    this.mascotStyle = mascot;
    ThemeManager.saveConfig({ mascotStyle: mascot });
  }

  public setFontFamily(font: string): void {
    this.fontFamily = font;
    ThemeManager.saveConfig({ fontFamily: font });
  }

  public setFontSize(size: number): void {
    this.fontSize = size;
    ThemeManager.saveConfig({ fontSize: size });
  }

  /**
   * Return Recode mascot lines styled with the active theme color.
   */
  public getMascotLines(theme = ThemeManager.get()): string[] {
    const col = (str: string) => theme.mascot(str);

    switch (this.mascotStyle) {
      case "robot":
      case "retro":
      default:
        // Classic Recode Robot Logo
        return [
          col("          [■■■]           "),
          col("         [ o o ]          "),
          col("          [===]           "),
        ];

      case "mini":
        return [col("   [● recode ●]   ")];

      case "off":
        return [];
    }
  }
}
