fn main() {
    let cargo_toml =
        std::fs::read_to_string("../recode/Cargo.toml").expect("Failed to read crates/recode/Cargo.toml");
    let version = cargo_toml
        .lines()
        .find(|line| line.starts_with("version = "))
        .expect("Version not found in crates/recode/Cargo.toml")
        .split('=')
        .nth(1)
        .expect("Invalid version format")
        .trim()
        .trim_matches('"');
    println!("cargo:rerun-if-changed=../recode/Cargo.toml");
    println!("cargo:rustc-env=RECODE_PKG_VERSION={}", version);
}
