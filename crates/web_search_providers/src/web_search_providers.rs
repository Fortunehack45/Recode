use client::{Client, UserStore};
use gpui::{App, Entity};
use std::sync::Arc;

pub fn init(_client: Arc<Client>, _user_store: Entity<UserStore>, _cx: &mut App) {
    // Hosted web search proxy removed; BYOK models and tool extensions perform searches directly.
}
