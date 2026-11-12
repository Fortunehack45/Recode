#![allow(clippy::disallowed_methods, reason = "build scripts are exempt")]
use std::process::Command;

const RECODE_MANIFEST: &str = include_str!("../recode/Cargo.toml");

fn main() {
    let recode_cargo_toml =
        toml_edit::ImDocument::parse(RECODE_MANIFEST).expect("failed to parse recode Cargo.toml");
    let version = recode_cargo_toml
        .get("package")
        .and_then(|package| package.get("version"))
        .and_then(toml_edit::Item::as_str)
        .expect("recode Cargo.toml must declare a package version string");
    println!("cargo:rustc-env=RECODE_PKG_VERSION={version}");
    println!(
        "cargo:rustc-env=TARGET={}",
        std::env::var("TARGET").unwrap()
    );

    // Populate git sha environment variable if git is available
    println!("cargo:rerun-if-changed=../../.git/logs/HEAD");
    if let Some(output) = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .ok()
        .filter(|output| output.status.success())
    {
        let git_sha = String::from_utf8_lossy(&output.stdout);
        let git_sha = git_sha.trim();

        println!("cargo:rustc-env=RECODE_COMMIT_SHA={git_sha}");
    }
    if let Some(build_identifier) = option_env!("GITHUB_RUN_NUMBER") {
        println!("cargo:rustc-env=RECODE_BUILD_ID={build_identifier}");
    }
}
