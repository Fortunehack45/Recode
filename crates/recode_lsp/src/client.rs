//! Language client session manager, document versioning, and lifecycle coordination.

use crate::diagnostics_store::DiagnosticsStore;
use crate::protocol::{JsonRpcNotification, JsonRpcRequest};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;

/// Lifecycle state of a connected language server.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub enum LanguageServerState {
    Uninitialized,
    Starting,
    Ready,
    Stopped(Option<String>),
}

/// A coordinator for a language server instance communicating with the editor.
#[derive(Clone, Debug)]
pub struct LspSession {
    server_name: String,
    state: LanguageServerState,
    next_request_id: u64,
    open_documents: HashMap<String, i32>,
    pub diagnostics: DiagnosticsStore,
}

impl LspSession {
    pub fn new(server_name: impl Into<String>) -> Self {
        Self {
            server_name: server_name.into(),
            state: LanguageServerState::Uninitialized,
            next_request_id: 1,
            open_documents: HashMap::new(),
            diagnostics: DiagnosticsStore::new(),
        }
    }

    pub fn server_name(&self) -> &str {
        &self.server_name
    }

    pub fn state(&self) -> &LanguageServerState {
        &self.state
    }

    pub fn set_state(&mut self, state: LanguageServerState) {
        self.state = state;
    }

    /// Allocates a new unique request ID.
    pub fn next_id(&mut self) -> u64 {
        let id = self.next_request_id;
        self.next_request_id += 1;
        id
    }

    /// Builds standard `initialize` request.
    pub fn make_initialize_request(&mut self, root_uri: Option<&str>) -> JsonRpcRequest {
        let id = self.next_id();
        self.state = LanguageServerState::Starting;
        JsonRpcRequest::new(
            id,
            "initialize",
            json!({
                "processId": std::process::id(),
                "rootUri": root_uri,
                "capabilities": {
                    "textDocument": {
                        "hover": { "contentFormat": ["markdown", "plaintext"] },
                        "completion": {
                            "completionItem": {
                                "snippetSupport": true,
                                "documentationFormat": ["markdown", "plaintext"]
                            }
                        },
                        "synchronization": {
                            "didSave": true,
                            "willSave": false,
                            "change": 2 // Incremental
                        }
                    }
                }
            }),
        )
    }

    /// Builds `textDocument/didOpen` notification.
    pub fn make_did_open(&mut self, uri: &str, language_id: &str, text: &str) -> JsonRpcNotification {
        self.open_documents.insert(uri.to_string(), 1);
        JsonRpcNotification::new(
            "textDocument/didOpen",
            json!({
                "textDocument": {
                    "uri": uri,
                    "languageId": language_id,
                    "version": 1,
                    "text": text
                }
            }),
        )
    }

    /// Builds `textDocument/didChange` notification, incrementing version.
    pub fn make_did_change(&mut self, uri: &str, text: &str) -> JsonRpcNotification {
        let version = self.open_documents.entry(uri.to_string()).or_insert(0);
        *version += 1;
        let cur_ver = *version;

        JsonRpcNotification::new(
            "textDocument/didChange",
            json!({
                "textDocument": {
                    "uri": uri,
                    "version": cur_ver
                },
                "contentChanges": [{
                    "text": text
                }]
            }),
        )
    }

    /// Builds `textDocument/didSave` notification.
    pub fn make_did_save(&mut self, uri: &str) -> JsonRpcNotification {
        JsonRpcNotification::new(
            "textDocument/didSave",
            json!({
                "textDocument": {
                    "uri": uri
                }
            }),
        )
    }

    /// Builds `textDocument/didClose` notification.
    pub fn make_did_close(&mut self, uri: &str) -> JsonRpcNotification {
        self.open_documents.remove(uri);
        self.diagnostics.clear_uri(uri);
        JsonRpcNotification::new(
            "textDocument/didClose",
            json!({
                "textDocument": {
                    "uri": uri
                }
            }),
        )
    }

    /// Builds standard `$/cancelRequest` notification for superseded requests.
    pub fn make_cancel_request(&mut self, id: u64) -> JsonRpcNotification {
        JsonRpcNotification::new("$/cancelRequest", json!({ "id": id }))
    }
}
