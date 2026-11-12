#!/usr/bin/env sh
set -eu

# Downloads a tarball from https://recode.dev/releases and unpacks it
# into ~/.local/. If you'd prefer to do this manually, instructions are at
# https://recode.dev/docs/linux.

main() {
    platform="$(uname -s)"
    arch="$(uname -m)"
    channel="${RECODE_CHANNEL:-stable}"
    RECODE_VERSION="${RECODE_VERSION:-latest}"
    # Use TMPDIR if available (for environments with non-standard temp directories)
    if [ -n "${TMPDIR:-}" ] && [ -d "${TMPDIR}" ]; then
        temp="$(mktemp -d "$TMPDIR/recode-XXXXXX")"
    else
        temp="$(mktemp -d "/tmp/recode-XXXXXX")"
    fi

    if [ "$platform" = "Darwin" ]; then
        platform="macos"
    elif [ "$platform" = "Linux" ]; then
        platform="linux"
    else
        echo "Unsupported platform $platform"
        exit 1
    fi

    case "$platform-$arch" in
        macos-arm64* | linux-arm64* | linux-aarch64)
            arch="aarch64"
            ;;
        macos-x86* | linux-x86*)
            arch="x86_64"
            ;;
        *)
            echo "Unsupported platform or architecture"
            exit 1
            ;;
    esac

    if command -v curl >/dev/null 2>&1; then
        curl () {
            command curl -fL "$@"
        }
    elif command -v wget >/dev/null 2>&1; then
        curl () {
            wget -O- "$@"
        }
    else
        echo "Could not find 'curl' or 'wget' in your path"
        exit 1
    fi

    "$platform" "$@"

    if [ "$(command -v recode)" = "$HOME/.local/bin/recode" ]; then
        echo "Recode has been installed. Run with 'recode'"
    else
        echo "To run Recode from your terminal, you must add ~/.local/bin to your PATH"
        echo "Run:"

        case "$SHELL" in
            *zsh)
                echo "   echo 'export PATH=\$HOME/.local/bin:\$PATH' >> ~/.zshrc"
                echo "   source ~/.zshrc"
                ;;
            *fish)
                echo "   fish_add_path -U $HOME/.local/bin"
                ;;
            *)
                echo "   echo 'export PATH=\$HOME/.local/bin:\$PATH' >> ~/.bashrc"
                echo "   source ~/.bashrc"
                ;;
        esac

        echo "To run Recode now, '~/.local/bin/recode'"
    fi
}

linux() {
    if [ -n "${RECODE_BUNDLE_PATH:-}" ]; then
        cp "$RECODE_BUNDLE_PATH" "$temp/recode-linux-$arch.tar.gz"
    else
        echo "Downloading Recode version: $RECODE_VERSION"
        curl "https://cloud.recode.dev/releases/$channel/$RECODE_VERSION/download?asset=recode&arch=$arch&os=linux&source=install.sh" > "$temp/recode-linux-$arch.tar.gz"
    fi

    suffix=""
    if [ "$channel" != "stable" ]; then
        suffix="-$channel"
    fi

    appid=""
    case "$channel" in
      stable)
        appid="dev.recode.Recode"
        ;;
      nightly)
        appid="dev.recode.Recode-Nightly"
        ;;
      preview)
        appid="dev.recode.Recode-Preview"
        ;;
      dev)
        appid="dev.recode.Recode-Dev"
        ;;
      *)
        echo "Unknown release channel: ${channel}. Using stable app ID."
        appid="dev.recode.Recode"
        ;;
    esac

    # Unpack
    rm -rf "$HOME/.local/recode$suffix.app"
    mkdir -p "$HOME/.local/recode$suffix.app"
    tar -xzf "$temp/recode-linux-$arch.tar.gz" -C "$HOME/.local/"

    recode_editor="$HOME/.local/recode$suffix.app/libexec/recode-editor"
    if [ -f "$recode_editor" ] && command -v ldd >/dev/null 2>&1; then
        missing="$(ldd "$recode_editor" 2>/dev/null | sed -n 's/^[[:space:]]*\(.*\) => not found$/\1/p')"
        if [ -n "$missing" ]; then
            echo "Warning: your system is missing libraries that Recode needs:"
            echo "$missing" | sed 's/^/    /'
            echo "Install them with your package manager, or Recode will fail to start."
        fi
    fi

    # Setup ~/.local directories
    mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications"

    # Link the binary
    if [ -f "$HOME/.local/recode$suffix.app/bin/recode" ]; then
        ln -sf "$HOME/.local/recode$suffix.app/bin/recode" "$HOME/.local/bin/recode"
    else
        # support for versions before 0.139.x.
        ln -sf "$HOME/.local/recode$suffix.app/bin/cli" "$HOME/.local/bin/recode"
    fi

    # Copy .desktop file
    desktop_file_path="$HOME/.local/share/applications/${appid}.desktop"
    src_dir="$HOME/.local/recode$suffix.app/share/applications"
    if [ -f "$src_dir/${appid}.desktop" ]; then
        cp "$src_dir/${appid}.desktop" "${desktop_file_path}"
    else
        # Fallback for older tarballs
        cp "$src_dir/recode$suffix.desktop" "${desktop_file_path}"
    fi
    sed -i "s|Icon=recode|Icon=$HOME/.local/recode$suffix.app/share/icons/hicolor/512x512/apps/recode.png|g" "${desktop_file_path}"
    sed -i "s|Exec=recode|Exec=$HOME/.local/recode$suffix.app/bin/recode|g" "${desktop_file_path}"
}

macos() {
    echo "Downloading Recode version: $RECODE_VERSION"
    curl "https://cloud.recode.dev/releases/$channel/$RECODE_VERSION/download?asset=recode&os=macos&arch=$arch&source=install.sh" > "$temp/Recode-$arch.dmg"
    hdiutil attach -quiet "$temp/Recode-$arch.dmg" -mountpoint "$temp/mount"
    app="$(cd "$temp/mount/"; echo *.app)"
    echo "Installing $app"
    if [ -d "/Applications/$app" ]; then
        echo "Removing existing $app"
        rm -rf "/Applications/$app"
    fi
    ditto "$temp/mount/$app" "/Applications/$app"
    hdiutil detach -quiet "$temp/mount"

    mkdir -p "$HOME/.local/bin"
    # Link the binary
    ln -sf "/Applications/$app/Contents/MacOS/cli" "$HOME/.local/bin/recode"
}

main "$@"
