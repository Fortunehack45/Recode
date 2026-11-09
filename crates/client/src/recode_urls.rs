//! Contains helper functions for constructing URLs to various Recode services and pages.
//! Central endpoints module: All external service URLs are constructed and overridable here.

use gpui::App;
use std::env;

pub const DEFAULT_RECODE_REPO_URL: &str = "https://github.com/Fortunehack45/Recode";
pub const DEFAULT_RECODE_COLLAB_URL: &str = "wss://recode-collab.fly.dev";
pub const DEFAULT_RECODE_API_URL: &str = "https://api.github.com/repos/Fortunehack45/Recode";
pub const DEFAULT_RECODE_UPDATES_URL: &str = "https://github.com/Fortunehack45/Recode/releases/latest/download/latest.json";
pub const DEFAULT_RECODE_EXTENSIONS_URL: &str = "https://api.github.com/repos/Fortunehack45/Recode/releases";
pub const DEFAULT_RECODE_DOCS_URL: &str = "https://github.com/Fortunehack45/Recode#readme";
pub const DEFAULT_RECODE_GITHUB_CLIENT_ID: &str = "178c6fc778ccc68e1d6a";

/// Central GitHub OAuth Client ID for Device Flow, overridable via `RECODE_GITHUB_CLIENT_ID`.
pub fn github_client_id() -> String {
    env::var("RECODE_GITHUB_CLIENT_ID").unwrap_or_else(|_| DEFAULT_RECODE_GITHUB_CLIENT_ID.to_string())
}

/// Central API URL, overridable via `RECODE_API_URL`.
pub fn api_url() -> String {
    env::var("RECODE_API_URL").unwrap_or_else(|_| DEFAULT_RECODE_API_URL.to_string())
}

/// Central Collaboration Server URL, overridable via `RECODE_COLLAB_URL`.
pub fn collab_url() -> String {
    env::var("RECODE_COLLAB_URL").unwrap_or_else(|_| DEFAULT_RECODE_COLLAB_URL.to_string())
}

/// Central Auto-Updates manifest URL, overridable via `RECODE_UPDATES_URL`.
pub fn updates_url() -> String {
    env::var("RECODE_UPDATES_URL").unwrap_or_else(|_| DEFAULT_RECODE_UPDATES_URL.to_string())
}

/// Central Extensions index URL, overridable via `RECODE_EXTENSIONS_URL`.
pub fn extensions_url() -> String {
    env::var("RECODE_EXTENSIONS_URL").unwrap_or_else(|_| DEFAULT_RECODE_EXTENSIONS_URL.to_string())
}

/// Central Documentation URL, overridable via `RECODE_DOCS_URL`.
pub fn docs_url(_cx: &App) -> String {
    env::var("RECODE_DOCS_URL").unwrap_or_else(|_| DEFAULT_RECODE_DOCS_URL.to_string())
}

pub fn account_url(_cx: &App) -> String {
    format!("{DEFAULT_RECODE_REPO_URL}#readme")
}

pub fn start_trial_url(_cx: &App) -> String {
    DEFAULT_RECODE_REPO_URL.to_string()
}

pub fn upgrade_to_zed_pro_url(_cx: &App) -> String {
    DEFAULT_RECODE_REPO_URL.to_string()
}

pub fn terms_of_service(_cx: &App) -> String {
    format!("{DEFAULT_RECODE_REPO_URL}/blob/main/legal/terms.md")
}

pub fn ai_privacy_and_security(_cx: &App) -> String {
    format!("{DEFAULT_RECODE_REPO_URL}/blob/main/PRIVACY_NOTES.md")
}

pub fn edit_prediction_docs(_cx: &App) -> String {
    docs_url(_cx)
}

pub fn skills_docs(_cx: &App) -> String {
    format!("{DEFAULT_RECODE_REPO_URL}#readme")
}

pub fn sandboxing_docs(_section: Option<&str>, _cx: &App) -> String {
    format!("{DEFAULT_RECODE_REPO_URL}#readme")
}

pub fn llm_provider_docs(_cx: &App) -> String {
    docs_url(_cx)
}

pub fn acp_registry_blog(_cx: &App) -> String {
    DEFAULT_RECODE_REPO_URL.to_string()
}

pub fn shared_agent_thread_url(session_id: &str) -> String {
    format!("recode://agent/shared/{}", session_id)
}
