//! JSON-RPC 2.0 wire protocol framing and message serialization.

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// An outgoing JSON-RPC 2.0 request.
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub id: u64,
    pub method: String,
    pub params: Value,
}

impl JsonRpcRequest {
    pub fn new(id: u64, method: impl Into<String>, params: Value) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id,
            method: method.into(),
            params,
        }
    }

    /// Formats the request with standard LSP Content-Length framing.
    pub fn to_framed_bytes(&self) -> Vec<u8> {
        let json = serde_json::to_string(self).unwrap_or_default();
        let header = format!("Content-Length: {}\r\n\r\n", json.len());
        let mut framed = Vec::with_capacity(header.len() + json.len());
        framed.extend_from_slice(header.as_bytes());
        framed.extend_from_slice(json.as_bytes());
        framed
    }
}

/// An outgoing JSON-RPC 2.0 notification.
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub struct JsonRpcNotification {
    pub jsonrpc: String,
    pub method: String,
    pub params: Value,
}

impl JsonRpcNotification {
    pub fn new(method: impl Into<String>, params: Value) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            method: method.into(),
            params,
        }
    }

    /// Formats the notification with standard LSP Content-Length framing.
    pub fn to_framed_bytes(&self) -> Vec<u8> {
        let json = serde_json::to_string(self).unwrap_or_default();
        let header = format!("Content-Length: {}\r\n\r\n", json.len());
        let mut framed = Vec::with_capacity(header.len() + json.len());
        framed.extend_from_slice(header.as_bytes());
        framed.extend_from_slice(json.as_bytes());
        framed
    }
}

/// A streaming byte decoder for LSP Content-Length framed packets.
#[derive(Default)]
pub struct PacketDecoder {
    buffer: Vec<u8>,
}

impl PacketDecoder {
    pub fn new() -> Self {
        Self { buffer: Vec::new() }
    }

    /// Appends incoming chunks from the language server stdout.
    pub fn feed(&mut self, bytes: &[u8]) {
        self.buffer.extend_from_slice(bytes);
    }

    /// Attempts to extract the next complete JSON-RPC payload.
    pub fn decode_next(&mut self) -> Option<Value> {
        // Search for header delimiter "\r\n\r\n"
        let header_delim = b"\r\n\r\n";
        let delim_pos = self
            .buffer
            .windows(header_delim.len())
            .position(|w| w == header_delim)?;

        let header_bytes = &self.buffer[..delim_pos];
        let header_str = std::str::from_utf8(header_bytes).ok()?;

        // Parse "Content-Length: <len>"
        let mut content_length = None;
        for line in header_str.split("\r\n") {
            if let Some(val_str) = line.strip_prefix("Content-Length:") {
                content_length = val_str.trim().parse::<usize>().ok();
                break;
            }
        }

        let body_len = content_length?;
        let body_start = delim_pos + header_delim.len();
        let body_end = body_start + body_len;

        if self.buffer.len() < body_end {
            // Incomplete body; await more chunks
            return None;
        }

        let body_bytes = &self.buffer[body_start..body_end];
        let value = serde_json::from_slice::<Value>(body_bytes).ok()?;

        // Drain the consumed message from buffer
        self.buffer.drain(..body_end);

        Some(value)
    }
}
