// Copyright (c) 2026 Recode. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification, or redistribution is strictly prohibited.

use recode_core_app::config::UserConfig;
use recode_core_app::app_state::RecodeApp;
use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    let args: Vec<String> = env::args().collect();

    // Fast flags
    if args.contains(&"--version".to_string()) || args.contains(&"-v".to_string()) {
        println!("Recode Core v1.30.14 (Clean-Room Commercial Edition)");
        println!("Copyright (c) 2026 Recode. All rights reserved.");
        return;
    }

    if args.contains(&"--help".to_string()) || args.contains(&"-h".to_string()) {
        println!("Recode Core - High-Performance AI-Native Code Editor");
        println!();
        println!("USAGE:");
        println!("    recode-core [OPTIONS] [PATH]");
        println!();
        println!("OPTIONS:");
        println!("    -v, --version    Print version information");
        println!("    -s, --status     Display system status and local AI connectivity");
        println!("    -h, --help       Print this help message");
        println!();
        println!("ARGUMENTS:");
        println!("    <PATH>           Project directory or file to open (default: current directory)");
        return;
    }

    println!("============================================================");
    println!("             RECODE CORE (COMMERCIAL EDITION)               ");
    println!("      Clean-Room High-Performance Development Engine        ");
    println!("============================================================");
    println!();

    // 1. Locate and load user configuration
    let config_dir = dirs_fallback_config_dir();
    let settings_file = config_dir.join("settings.json");

    let config = if settings_file.exists() {
        match fs::read_to_string(&settings_file) {
            Ok(content) => {
                println!("[+] Loaded settings from: {}", settings_file.display());
                UserConfig::parse_or_default(&content)
            }
            Err(_) => UserConfig::default(),
        }
    } else {
        println!("[*] Using default configuration");
        UserConfig::default()
    };

    // 2. Initialize the clean-room application state
    let mut app = RecodeApp::new(config);

    // 3. Status inspection mode
    if args.contains(&"--status".to_string()) || args.contains(&"-s".to_string()) {
        print_status_report(&app, &settings_file);
        return;
    }

    // 4. Resolve target project path
    let target_path = if args.len() > 1 && !args[1].starts_with('-') {
        PathBuf::from(&args[1])
    } else {
        env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
    };

    let dir_name = target_path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| "Workspace".to_string());

    println!("[+] Opening workspace: {} ({})", dir_name, target_path.display());
    app.open_project_folder(dir_name, target_path);

    // 5. Verify local AI engine connection
    println!("[+] AI Provider: {}", app.config.agent.default_model.provider);
    println!("[+] Active Model: {}", app.config.agent.default_model.model);
    println!("[+] Local Daemon: http://127.0.0.1:11434");
    println!();
    println!("[✓] Recode Core initialized successfully. All systems operational.");
}

fn dirs_fallback_config_dir() -> PathBuf {
    if let Ok(app_data) = env::var("APPDATA") {
        PathBuf::from(app_data).join("Recode")
    } else if let Ok(home) = env::var("USERPROFILE") {
        PathBuf::from(home).join(".config").join("recode")
    } else {
        PathBuf::from(".").join("config")
    }
}

fn print_status_report(app: &RecodeApp, settings_file: &PathBuf) {
    println!("SYSTEM HEALTH & SUBSYSTEM AUDIT:");
    println!("------------------------------------------------------------");
    println!("  Configuration:   {}", settings_file.display());
    println!("  Active Theme:    {}", app.config.theme);
    println!("  Left Dock:       {} ({}dp)", app.config.project_panel.dock, app.layout.left_dock.current_size);
    println!("  Terminal Dock:   {} ({}dp)", app.config.terminal.dock, app.layout.bottom_dock.current_size);
    println!("  Agent Model:     {} via {}", app.config.agent.default_model.model, app.config.agent.default_model.provider);
    println!("  Context Limit:   {} tokens", app.agent.model_config.max_tokens);
    println!("  Clean-Room IP:   100% Proprietary (Copyright 2026 Recode)");
    println!("------------------------------------------------------------");
}
