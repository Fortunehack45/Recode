import { c } from "./colors.js";

// Standard regex to match all ANSI escape codes
const ANSI_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, "");
}

export function visibleWidth(str: string): number {
  return stripAnsi(str).length;
}

export function padRight(str: string, width: number): string {
  const current = visibleWidth(str);
  if (current >= width) return str;
  return str + " ".repeat(width - current);
}

export function padCenter(str: string, width: number): string {
  const current = visibleWidth(str);
  if (current >= width) return str;
  const left = Math.floor((width - current) / 2);
  const right = width - current - left;
  return " ".repeat(left) + str + " ".repeat(right);
}

/**
 * Fit string to exact cell width.
 * If shorter, pads with spaces.
 * If longer, safely truncates visible characters while preserving ANSI escape styling.
 */
export function fitCell(str: string, width: number): string {
  const current = visibleWidth(str);
  if (current === width) return str;
  if (current < width) {
    return str + " ".repeat(width - current);
  }

  // String is longer than width: truncate visible characters
  let visibleCount = 0;
  let result = "";
  let inEscape = false;
  let escapeBuffer = "";
  const maxVisible = width > 3 ? width - 1 : width;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === "\x1B") {
      inEscape = true;
      escapeBuffer += char;
      continue;
    }

    if (inEscape) {
      escapeBuffer += char;
      if (char === "m") {
        result += escapeBuffer;
        escapeBuffer = "";
        inEscape = false;
      }
      continue;
    }

    if (visibleCount < maxVisible) {
      result += char;
      visibleCount++;
    } else {
      break;
    }
  }

  if (width > 3) {
    result += "…\x1b[0m";
    visibleCount++;
  } else {
    result += "\x1b[0m";
  }

  if (visibleCount < width) {
    result += " ".repeat(width - visibleCount);
  }

  return result;
}

export interface BoxOptions {
  width?: number;
  borderColor?: (s: string) => string;
  padding?: number;
  rounded?: boolean;
}

export function renderBox(
  lines: string[],
  title?: string,
  options: BoxOptions = {}
): string {
  const color = options.borderColor || c.gray;
  const rounded = options.rounded !== false;
  const tl = rounded ? "╭" : "┌";
  const tr = rounded ? "╮" : "┐";
  const bl = rounded ? "╰" : "└";
  const br = rounded ? "╯" : "┘";
  const horiz = "─";
  const vert = "│";

  // Calculate inner width dynamically based on content if not specified
  let maxContent = 0;
  for (const line of lines) {
    const w = visibleWidth(line);
    if (w > maxContent) maxContent = w;
  }
  if (title) {
    const tw = visibleWidth(title) + 4;
    if (tw > maxContent) maxContent = tw;
  }

  const termWidth = process.stdout.columns || 80;
  const boxWidth = Math.min(termWidth - 2, Math.max(options.width || 72, maxContent + 4));
  const innerWidth = boxWidth - 2;

  const result: string[] = [];

  // Top border
  if (title) {
    const titleVisible = visibleWidth(title);
    const rightLen = Math.max(0, innerWidth - titleVisible - 3);
    result.push(color(`${tl}${horiz} `) + title + color(` ${horiz.repeat(rightLen)}${tr}`));
  } else {
    result.push(color(`${tl}${horiz.repeat(innerWidth)}${tr}`));
  }

  // Content lines
  for (const line of lines) {
    const padded = padRight(`  ${line}`, innerWidth);
    result.push(color(vert) + padded + color(vert));
  }

  // Bottom border
  result.push(color(`${bl}${horiz.repeat(innerWidth)}${br}`));

  return result.join("\n");
}
