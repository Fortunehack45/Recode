//! Contains helper functions for constructing URLs to various Recode-related pages.

use gpui::App;

const RECODE_REPO_URL: &str = "https://github.com/Fortunehack45/Recode";

fn server_url(_cx: &App) -> &str {
    RECODE_REPO_URL
}

fn docs_url(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

/// Returns the URL to the account page.
pub fn account_url(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

/// Returns the URL to the start trial page.
pub fn start_trial_url(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

/// Returns the URL to the upgrade page.
pub fn upgrade_to_zed_pro_url(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

/// Returns the URL to Recode's terms of service.
pub fn terms_of_service(_cx: &App) -> String {
    format!("{RECODE_REPO_URL}/blob/main/legal/terms.md")
}

/// Returns the URL to Recode AI's privacy and security docs.
pub fn ai_privacy_and_security(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

/// Returns the URL to Recode's edit prediction documentation.
pub fn edit_prediction_docs(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

pub fn skills_docs(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

/// Returns the URL to Recode's Agent sandboxing documentation.
pub fn sandboxing_docs(_section: Option<&str>, _cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

pub fn llm_provider_docs(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

/// Returns the URL to Recode's ACP registry blog post.
pub fn acp_registry_blog(_cx: &App) -> String {
    RECODE_REPO_URL.to_string()
}

pub fn shared_agent_thread_url(session_id: &str) -> String {
    format!("recode://agent/shared/{}", session_id)
}
