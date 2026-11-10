---
name: cli
description: Master-level command-line interface (CLI) and terminal engineering. Covers POSIX argument parsing conventions, ANSI escape sequences, TTY detection (isatty), terminal multiplexing, signal handling (SIGINT/SIGTERM), and cross-platform process orchestration.
---

# CLI & Terminal Systems Engineering

This skill provides exhaustive guidance on engineering robust, Unix-compliant, responsive command-line applications and interactive terminal tools across Linux, macOS, and Windows.

---

## 1. Unix CLI Standards & POSIX Argument Parsing Conventions

A professional CLI must adhere strictly to the POSIX Utility Syntax Guidelines:
1. **Short Options**: Single hyphen followed by a single character (e.g., `-v`, `-f`). Multiple boolean flags can be chained (e.g., `-rf` $\equiv$ `-r -f`).
2. **Long Options (GNU Style)**: Double hyphen followed by multi-character kebab-case names (e.g., `--verbose`, `--output-format`).
3. **Values with Options**: Options taking arguments should accept both separated and equal syntax: `--output=file.json` and `--output file.json`.
4. **The End-of-Options Delimiter (`--`)**: A standalone `--` signals the end of all command options. Everything following must be treated strictly as positional operands, even if starting with a hyphen:
   ```bash
   recode -- -filename-starting-with-dash.txt
   ```
5. **Standard Exit Codes**:
   - `0`: Success / clean termination.
   - `1`: General runtime error.
   - `2`: Misuse of shell built-ins or command syntax / argument parsing failure.
   - `126`: Command invoked cannot execute (permission denied).
   - `127`: Command not found.
   - `128 + N`: Terminated by signal $N$ (e.g., $130 = 128 + 2$ for `SIGINT` / Ctrl+C).

---

## 2. Terminal Capabilities & TTY Detection

Never output ANSI escape sequences, interactive spinners, or color codes if the output is redirected to a file or piped to another process:

### TTY Detection Matrix (Python & Rust)
```python
import sys, os

def can_render_color() -> bool:
    # 1. Respect the NO_COLOR standard (https://no-color.org)
    if "NO_COLOR" in os.environ:
        return False
    # 2. Check if stdout is an interactive terminal
    if not sys.stdout.isatty():
        return False
    # 3. Check for dumb terminals
    if os.environ.get("TERM") == "dumb":
        return False
    return True
```

```rust
use std::io::IsTerminal;

fn should_colorize() -> bool {
    std::env::var_os("NO_COLOR").is_none() && std::io::stdout().is_terminal()
}
```

---

## 3. Signal Trapping & Graceful Terminal Teardown

If a CLI enters raw mode or displays an alternate screen buffer, it **must** trap termination signals to restore the terminal cursor and state before exiting:

```rust
use crossterm::{
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    cursor::{Hide, Show},
};
use std::io::{stdout, Result};

pub struct TerminalGuard;

impl TerminalGuard {
    pub fn init() -> Result<Self> {
        enable_raw_mode()?;
        execute!(stdout(), EnterAlternateScreen, Hide)?;
        Ok(Self)
    }
}

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        // Automatically invoked on normal exit or panic unwind
        let _ = execute!(stdout(), Show, LeaveAlternateScreen);
        let _ = disable_raw_mode();
    }
}
```

---

## 4. CLI Engineering Checklist

- [ ] **Standard Streams**: Send normal output to `stdout` (channel 1) and all error messages/logs to `stderr` (channel 2).
- [ ] **Help & Version Flags**: Always support `--help` (`-h`) and `--version` (`-V`) flags natively.
- [ ] **Non-Interactive Mode**: Provide a `--quiet` (`-q`) or `--batch` flag to disable interactive prompts for CI/CD scripting.
- [ ] **Color Standards**: Respect `NO_COLOR`, `CLICOLOR`, and `CLICOLOR_FORCE` environment variables.
