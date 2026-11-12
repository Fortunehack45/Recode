---
title: CLI Reference
description: "Reference for Recode's command-line interface (CLI), including opening files and directories, integrating with tools, and controlling Recode from scripts."
---

# CLI Reference

Use Recode's command-line interface (CLI) to open files and directories, integrate with other tools, and control Recode from scripts.

## Installation

**macOS:** Run the {#action cli::InstallCliBinary} command from the command palette ({#kb command_palette::Toggle}) to install the `recode` CLI to `/usr/local/bin/recode`.

**Linux:** The CLI is included with Recode packages (`recode`).

**Windows:** The CLI is included with Recode. Add Recode's installation directory to your PATH, or use the full path to `recode.exe`.

## Usage

```sh
recode [OPTIONS] [PATHS]...
```

## Opening Files and Directories

Open a file:

```sh
recode myfile.txt
```

Open a directory as a workspace:

```sh
recode ~/projects/myproject
```

Open multiple files or directories:

```sh
recode file1.txt file2.txt ~/projects/myproject
```

Open a file at a specific line and column:

```sh
recode myfile.txt:42        # Open at line 42
recode myfile.txt:42:10     # Open at line 42, column 10
```

## Options

### `-w`, `--wait`

Wait for all opened files to be closed before the CLI exits. When opening a directory, waits until the window is closed.

This is useful for integrating Recode with tools that expect an editor to block until editing is complete (e.g., `git commit`):

```sh
export EDITOR="recode --wait"
git commit  # Opens Recode and waits for you to close the commit message file
```

### `-n`, `--new`

Open paths in a new workspace window, even if the paths are already open in an existing window:

```sh
recode -n ~/projects/myproject
```

### `-a`, `--add`

Add paths to the currently focused workspace instead of opening a new window. When multiple workspace windows are open, files open in the focused window:

```sh
recode -a newfile.txt
```

### `-r`, `--reuse`

Reuse an existing window, replacing its current workspace with the new paths:

```sh
recode -r ~/projects/different-project
```

### `-e`, `--existing`

Open paths in an existing Recode window instead of creating a new one:

```sh
recode -e myfile.txt
```

By default (without `-n`, `-a`, `-r`, or `-e`), directories open in the current window's sidebar. You can change this default with the `cli_default_open_behavior` setting. See [Windows & Projects](../windows-and-projects.md) for more details.

### `--diff <OLD_PATH> <NEW_PATH>`

Open a diff view comparing two files. Can be specified multiple times:

```sh
recode --diff file1.txt file2.txt
recode --diff old.rs new.rs --diff old2.rs new2.rs
```

### `--foreground`

Run Recode in the foreground, keeping the terminal attached. Useful for debugging:

```sh
recode --foreground
```

### `--user-data-dir <DIR>`

Use a custom directory for all user data (database, extensions, logs) instead of the default location:

```sh
recode --user-data-dir ~/.recode-custom
```

Default locations:

- **macOS:** `~/Library/Application Support/Recode`
- **Linux:** `$XDG_DATA_HOME/recode` (typically `~/.local/share/recode`)
- **Windows:** `%LOCALAPPDATA%\Recode`

### `-v`, `--version`

Print Recode's version and exit:

```sh
recode --version
```

### `--completions <SHELL>`

Generate shell completions for the `recode` CLI:

#### Bash

Add to `~/.bashrc`:

```bash
eval "$(recode --completions bash)"
```

#### Elvish

Add to `~/.config/elvish/rc.elv`:

```elvish
set edit:completion:arg-completer[recode] = { |@args|
    eval (recode --completions elvish | slurp)
    $edit:completion:arg-completer[recode] $@args
}
```

#### Fish

Add to `~/.config/fish/config.fish`:

```fish
recode --completions fish | source
```

#### Nushell

Add to `~/.config/nushell/config.nu`:

```nu
mkdir ($nu.data-dir | path join "vendor/autoload")
^recode --completions nushell | save --force ($nu.data-dir | path join "vendor/autoload/recode.nu")
```

#### Powershell

Add to `$PROFILE`:

```powershell
(&recode --completions powershell) | Out-String | Invoke-Expression
```

#### Zsh

Add to `~/.zshrc`:

```zsh
eval "$(recode --completions zsh)"
```

### `--uninstall`

Uninstall Recode and remove all related files (macOS and Linux only):

```sh
recode --uninstall
```

### `--recode <PATH>`

Specify a custom path to the Recode application or binary:

```sh
recode --recode /path/to/Recode.app myfile.txt
```

## Reading from Standard Input

Read content from stdin by passing `-` as the path:

```sh
echo "Hello, World!" | recode -
cat myfile.txt | recode -
ps aux | recode -
```

This creates a temporary file with the stdin content and opens it in Recode.

## URL Handling

The CLI can open `recode://`, `file://`, and `ssh://` URLs:

```sh
recode recode://settings
recode file:///Users/whatever/.zshrc
recode ssh://me@example.com/abs/path
recode ssh://me@example.com:/abs/path
recode ssh://me@example.com/~/project
recode ssh://me@example.com:~/project
```

## Using Recode as Your Default Editor

Set Recode as your default editor for Git and other tools:

```sh
export EDITOR="recode --wait"
export VISUAL="recode --wait"
```

Add these lines to your shell configuration file (e.g., `~/.bashrc`, `~/.zshrc`).

## macOS: Switching Release Channels

On macOS, you can launch a specific release channel by passing the channel name as the first argument:

```sh
recode --stable myfile.txt
recode --preview myfile.txt
recode --nightly myfile.txt
```

## WSL Integration (Windows)

On Windows, the CLI supports opening paths from WSL distributions. This is handled automatically when launching Recode from within WSL.

## Exit Codes

| Code | Meaning                           |
| ---- | --------------------------------- |
| `0`  | Success                           |
| `1`  | Error (details printed to stderr) |

When using `--wait`, the exit code reflects whether the files were saved before closing.
