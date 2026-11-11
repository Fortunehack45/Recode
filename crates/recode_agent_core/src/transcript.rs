//! Conversation transcript, streaming message bubbles, and thread persistence.

use crate::tools::ToolCall;
use serde::{Deserialize, Serialize};

/// Author role in the conversation stream.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize)]
pub enum MessageRole {
    System,
    User,
    Assistant,
    Tool,
}

/// An individual message in the conversation stream.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: MessageRole,
    pub content: String,
    pub thinking_content: Option<String>,
    pub tool_calls: Vec<ToolCall>,
}

impl ChatMessage {
    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: MessageRole::User,
            content: content.into(),
            thinking_content: None,
            tool_calls: Vec::new(),
        }
    }

    pub fn assistant(content: impl Into<String>, thinking: Option<String>) -> Self {
        Self {
            role: MessageRole::Assistant,
            content: content.into(),
            thinking_content: thinking,
            tool_calls: Vec::new(),
        }
    }

    pub fn tool(content: impl Into<String>, tool_calls: Vec<ToolCall>) -> Self {
        Self {
            role: MessageRole::Tool,
            content: content.into(),
            thinking_content: None,
            tool_calls,
        }
    }
}

/// A persistent conversation thread with message history.
#[derive(Clone, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct ConversationThread {
    pub id: u64,
    pub title: String,
    pub messages: Vec<ChatMessage>,
}

impl ConversationThread {
    pub fn new(id: u64, title: impl Into<String>) -> Self {
        Self {
            id,
            title: title.into(),
            messages: Vec::new(),
        }
    }

    /// Appends a user prompt message.
    pub fn push_user(&mut self, text: impl Into<String>) {
        self.messages.push(ChatMessage::user(text));
    }

    /// Appends an assistant response message.
    pub fn push_assistant(&mut self, text: impl Into<String>, thinking: Option<String>) {
        self.messages.push(ChatMessage::assistant(text, thinking));
    }

    /// Total number of messages in the thread.
    pub fn len(&self) -> usize {
        self.messages.len()
    }

    pub fn is_empty(&self) -> bool {
        self.messages.is_empty()
    }
}
