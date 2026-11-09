import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ThemeManager, BUILTIN_THEMES } from "./theme.js";
import { FontManager, BORDER_STYLES } from "./font.js";
import { LiveActionIndicator } from "./action_state.js";
import { UI } from "./ui.js";

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

  // 3. Switch theme to Ayu Dark
  const success = tm.setTheme("ayu-dark");
  assert.strictEqual(success, true);
  assert.strictEqual(tm.theme.id, "ayu-dark");
  assert.strictEqual(tm.theme.name, "Ayu Dark");

  // 4. Switch theme to Claude Warm
  assert.strictEqual(tm.setTheme("claude-warm"), true);
  assert.strictEqual(tm.theme.id, "claude-warm");
  assert.strictEqual(tm.theme.palette.accent, "#e06c53");

  // 5. Custom accent override
  tm.setCustomAccent("#00f0ff");
  assert.strictEqual(tm.palette.accent, "#00f0ff");
  tm.setCustomAccent(null);
  assert.strictEqual(tm.palette.accent, "#e06c53");
});

test("FontManager configures border glyphs and retro mascot art", () => {
  const fm = FontManager.get();

  // 1. Dotted border style (matches Claude Code dashboard)
  fm.setBorderStyle("dotted");
  assert.strictEqual(fm.currentBorderStyle, "dotted");
  assert.strictEqual(fm.glyphs.horiz, "┄");
  assert.strictEqual(fm.glyphs.vert, "┆");

  // 2. Rounded border style
  fm.setBorderStyle("rounded");
  assert.strictEqual(fm.glyphs.horiz, "─");
  assert.strictEqual(fm.glyphs.vert, "│");

  // 3. Retro mascot
  fm.setMascotStyle("retro");
  assert.strictEqual(fm.currentMascotStyle, "retro");
  const mascotLines = fm.getMascotLines();
  assert.ok(mascotLines.length > 0);
  assert.ok(mascotLines.some((l) => l.includes("█")));
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
  UI.printRetroBanner();
  UI.printThemeGallery();
  UI.printFontMenu();
  UI.printColorPalette();
  UI.printHelp();
});
