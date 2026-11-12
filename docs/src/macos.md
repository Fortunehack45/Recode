---
title: Recode on macOS
description: "Recode is developed primarily on macOS, making it a first-class platform with full feature support."
---

# Recode on macOS

Recode is developed primarily on macOS, making it a first-class platform with full feature support.

## Installing Recode

Download Recode from the [download page](https://recode.dev/download). The download is a `.dmg` file—open it and drag Recode to your Applications folder.

For the preview build, which receives updates about a week ahead of stable, visit the [preview releases page](https://recode.dev/releases/preview).

After installation, Recode checks for updates automatically and prompts you when a new version is available.

### Homebrew

You can also install Recode using Homebrew:

```sh
brew install --cask recode
```

For the preview version:

```sh
brew install --cask recode@preview
```

### Building from Source

To build Recode from source, see the [macOS development documentation](./development/macos.md).

## System Requirements

- macOS 12.0 (Monterey) or later
- Apple Silicon (M1/M2/M3/M4) or Intel processor

Recode uses Metal for GPU-accelerated rendering, which is available on all supported macOS versions.

## Installing the CLI

Recode includes a command-line tool for opening files and projects from Terminal. To install it:

1. Open Recode
2. Open the command palette with `Cmd+Shift+P`
3. Run {#action cli::InstallCliBinary}

This creates a `recode` command in `/usr/local/bin`. You can then open files and folders:

```sh
recode .                    # Open current folder
recode file.txt             # Open a file
recode project/ file.txt    # Open a folder and a file
```

See the [CLI Reference](./reference/cli.md) for all available options.

## Uninstall

1. Quit Recode if it's running
2. Drag Recode from Applications to the Trash
3. Optionally, remove your settings and extensions:

```sh
rm -rf ~/.config/recode
rm -rf ~/Library/Application\ Support/Recode
rm -rf ~/Library/Caches/Recode
rm -rf ~/Library/Logs/Recode
rm -rf ~/Library/Saved\ Application\ State/dev.recode.Recode.savedState
```

If you installed the CLI, remove it with:

```sh
rm /usr/local/bin/recode
```

## Troubleshooting

### Recode won't open or shows "damaged" warning

If macOS reports that Recode is damaged or can't be opened, it's likely a Gatekeeper issue. Try:

1. Right-click (or Control-click) on Recode in Applications
2. Select "Open" from the context menu
3. Click "Open" in the dialog that appears

This tells macOS to trust the application.

If that doesn't work, remove the quarantine attribute:

```sh
xattr -cr /Applications/Recode.app
```

### CLI command not found

If the `recode` command isn't available after installation:

1. Check that `/usr/local/bin` is in your PATH
2. Try reinstalling the CLI via {#action cli::InstallCliBinary} in the command palette
3. Open a new terminal window to reload your PATH

### Can't install CLI {#cant-install-cli}

{#action cli::InstallCliBinary} writes a `recode` symlink to `/usr/local/bin`, which requires administrator privileges. If your macOS account isn't in the `admin` group, Recode can't create that symlink and will report that it can't install the CLI automatically.

Instead, you can add an alias pointing to the `cli` binary bundled inside the app. The path depends on where Recode is installed:

```sh
# Default install (Recode in /Applications)
alias recode="/Applications/Recode.app/Contents/MacOS/cli"

# User install (Recode in ~/Applications)
alias recode="$HOME/Applications/Recode.app/Contents/MacOS/cli"

# Preview build (Recode Preview in ~/Applications)
alias recode="$HOME/Applications/Recode Preview.app/Contents/MacOS/cli"
```

Add the line that matches your install to your shell configuration file. Use `~/.zshrc` for Zsh (the default on modern macOS) or `~/.bashrc` for Bash.

After you restart your shell, you will be able to use `recode` from your terminal:

```sh
recode .              # Open current folder
recode file.txt       # Open a file
```

### GPU or rendering issues

Recode uses Metal for rendering. If you experience graphical glitches:

1. Ensure macOS is up to date
2. Restart your Mac to reset the GPU state
3. Check Activity Monitor for GPU pressure from other apps

### High memory or CPU usage

If Recode uses more resources than expected:

1. Check for runaway language servers in the terminal output ({#action recode::OpenLog})
2. Try disabling extensions one by one to identify conflicts
3. For large projects, consider using [project settings](./reference/all-settings.md#file-scan-exclusions) to exclude unnecessary folders from indexing

For additional help, see the [Troubleshooting guide](./troubleshooting.md) or visit [GitHub Discussions](https://github.com/Fortunehack45/Recode/discussions).
