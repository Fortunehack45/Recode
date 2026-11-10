import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ThemeManager, BUILTIN_THEMES } from "./theme.js";
import { FontManager, BORDER_STYLES } from "./font.js";
import { LiveActionIndicator } from "./action_state.js";
import { UI } from "./ui.js";
import { fitCell, visibleWidth } from "./text.js";

test("fitCell strictly bounds visible width", () => {
  // 1. Shorter string padded
  const short = fitCell("hello", 10);
  assert.strictEqual(visibleWidth(short), 10);
  assert.strictEqual(short, "hello     ");

  // 2. Longer string truncated with ellipsis
  const long = fitCell("This is a very long string that should be bounded", 20);
  assert.strictEqual(visibleWidth(long), 20);
  assert.ok(long.includes("…"));

  // 3. String with ANSI escape codes
  const ansi = "\x1b[31mRed Alert Message\x1b[39m";
  const fitted = fitCell(ansi, 12);
  assert.strictEqual(visibleWidth(fitted), 12);
});

test("ThemeManager loads builtin Recode IDE themes and translates TrueColor", () => {
  const tm = ThemeManager.get();

  // 1. Built-in themes exist
  assert.ok(BUILTIN_THEMES["ayu-dark"]);
  assert.ok(BUILTIN_THEMES["one-dark"]);
  assert.ok(BUILTIN_THEMES["gruvbox-dark"]);
  assert.ok(BUILTIN_THEMES["recode-dark"]);
  assert.ok(BUILTIN_THEMES["claude-warm"]);

  // 2. Hex to RGB conversion
  const rgb = tm.hexToRgb("#5ac1fe");
  assert.deepStrictEqual(rgb, [90, 193, 254]);

  // 3. Switch theme to Recode Dark (monochrome white & black)
  assert.strictEqual(tm.setTheme("recode-dark"), true);
  assert.strictEqual(tm.theme.id, "recode-dark");
  assert.strictEqual(tm.theme.palette.accent, "#ffffff");

  // 4. Switch theme to Ayu Dark
  const success = tm.setTheme("ayu-dark");
  assert.strictEqual(success, true);
  assert.strictEqual(tm.theme.id, "ayu-dark");

  // 5. Switch back to Recode Dark
  tm.setTheme("recode-dark");
  assert.strictEqual(tm.theme.id, "recode-dark");
});

test("FontManager configures border glyphs and robot mascot art", () => {
  const fm = FontManager.get();

  // 1. Dotted border style
  fm.setBorderStyle("dotted");
  assert.strictEqual(fm.currentBorderStyle, "dotted");
  assert.strictEqual(fm.glyphs.horiz, "┄");
  assert.strictEqual(fm.glyphs.vert, "┆");

  // 2. Rounded border style
  fm.setBorderStyle("rounded");
  assert.strictEqual(fm.glyphs.horiz, "─");
  assert.strictEqual(fm.glyphs.vert, "│");

  // 3. Robot mascot
  fm.setMascotStyle("robot");
  assert.strictEqual(fm.currentMascotStyle, "robot");
  const mascotLines = fm.getMascotLines();
  assert.ok(mascotLines.length > 0);
  assert.ok(mascotLines.some((l) => l.includes("■")));
});

test("LiveActionIndicator tracks real-time action states", () => {
  const indicator = LiveActionIndicator.get();

  // Start simmering
  indicator.startSimmering();

  // Start reading file
  indicator.startTool("read_file", { path: "crates/zed/src/main.rs" });

  // Start editing file
  indicator.startTool("edit_file", { path: "packages/tui/src/repl.ts" });

  // Start executing command
  indicator.startTool("execute_command", { command: "git diff" });

  // Clear cleanly
  indicator.clear();
});

test("UI renders welcome splash and dashboard cards cleanly", () => {
  // Verify UI static methods run without error
  UI.printBoxedPill("Test Pill");
  UI.printBanner("1.30.3");
  UI.printThemeGallery();
  UI.printFontMenu();
  UI.printColorPalette();
  UI.printHelp();
  UI.printConnectMenu();
  UI.printModelCatalog(
    {
      "opencode-zen": {
        id: "zen",
        name: "OpenCode Zen (Recode)",
        provider: "opencode",
        contextWindow: 200000,
        supportsTools: true,
        supportsStreaming: true,
        description: "OpenCode flagship reasoning & agentic coding model.",
      },
    },
    "opencode-zen",
    { opencode: { configured: true } }
  );
});
