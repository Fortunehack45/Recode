#!/usr/bin/env sh
set -eu

# Uninstalls Recode that was installed using the install.sh script

check_remaining_installations() {
    platform="$(uname -s)"
    if [ "$platform" = "Darwin" ]; then
        # Check for any Recode variants in /Applications
        remaining=$(ls -d /Applications/Recode*.app 2>/dev/null | wc -l)
        [ "$remaining" -eq 0 ]
    else
        # Check for any Recode variants in ~/.local
        remaining=$(ls -d "$HOME/.local/recode"*.app 2>/dev/null | wc -l)
        [ "$remaining" -eq 0 ]
    fi
}

prompt_remove_preferences() {
    printf "Do you want to keep your Recode preferences? [Y/n] "
    read -r response
    case "$response" in
        [nN]|[nN][oO])
            rm -rf "$HOME/.config/recode"
            echo "Preferences removed."
            ;;
        *)
            echo "Preferences kept."
            ;;
    esac
}

main() {
    platform="$(uname -s)"
    channel="${RECODE_CHANNEL:-stable}"

    if [ "$platform" = "Darwin" ]; then
        platform="macos"
    elif [ "$platform" = "Linux" ]; then
        platform="linux"
    else
        echo "Unsupported platform $platform"
        exit 1
    fi

    "$platform"

    echo "Recode has been uninstalled"
}

linux() {
    suffix=""
    if [ "$channel" != "stable" ]; then
        suffix="-$channel"
    fi

    appid=""
    db_suffix="stable"
    case "$channel" in
      stable)
        appid="dev.recode.Recode"
        db_suffix="stable"
        ;;
      nightly)
        appid="dev.recode.Recode-Nightly"
        db_suffix="nightly"
        ;;
      preview)
        appid="dev.recode.Recode-Preview"
        db_suffix="preview"
        ;;
      dev)
        appid="dev.recode.Recode-Dev"
        db_suffix="dev"
        ;;
      *)
        echo "Unknown release channel: ${channel}. Using stable app ID."
        appid="dev.recode.Recode"
        db_suffix="stable"
        ;;
    esac

    # Remove the app directory
    rm -rf "$HOME/.local/recode$suffix.app"

    # Remove the binary symlink
    rm -f "$HOME/.local/bin/recode"

    # Remove the .desktop file
    rm -f "$HOME/.local/share/applications/${appid}.desktop"

    # Remove the database directory for this channel
    rm -rf "$HOME/.local/share/recode/db/0-$db_suffix"

    # Remove socket file
    rm -f "$HOME/.local/share/recode/recode-$db_suffix.sock"

    # Remove the entire Recode directory if no installations remain
    if check_remaining_installations; then
        rm -rf "$HOME/.local/share/recode"
        prompt_remove_preferences
    fi

    rm -rf $HOME/.recode_server
}

macos() {
    app="Recode.app"
    db_suffix="stable"
    app_id="dev.recode.Recode"
    case "$channel" in
      nightly)
        app="Recode Nightly.app"
        db_suffix="nightly"
        app_id="dev.recode.Recode-Nightly"
        ;;
      preview)
        app="Recode Preview.app"
        db_suffix="preview"
        app_id="dev.recode.Recode-Preview"
        ;;
      dev)
        app="Recode Dev.app"
        db_suffix="dev"
        app_id="dev.recode.Recode-Dev"
        ;;
    esac

    # Remove the app bundle
    if [ -d "/Applications/$app" ]; then
        rm -rf "/Applications/$app"
    fi

    # Remove the binary symlink
    rm -f "$HOME/.local/bin/recode"

    # Remove the database directory for this channel
    rm -rf "$HOME/Library/Application Support/Recode/db/0-$db_suffix"

    # Remove app-specific files and directories
    rm -rf "$HOME/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ApplicationRecentDocuments/$app_id.sfl"*
    rm -rf "$HOME/Library/Caches/$app_id"
    rm -rf "$HOME/Library/HTTPStorages/$app_id"
    rm -rf "$HOME/Library/Preferences/$app_id.plist"
    rm -rf "$HOME/Library/Saved Application State/$app_id.savedState"

    # Remove the entire Recode directory if no installations remain
    if check_remaining_installations; then
        rm -rf "$HOME/Library/Application Support/Recode"
        rm -rf "$HOME/Library/Logs/Recode"

        prompt_remove_preferences
    fi

    rm -rf $HOME/.recode_server
}

main "$@"
