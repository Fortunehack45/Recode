//! Model Context Protocol (MCP) server configuration and dynamic tool discovery.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Configuration for an external MCP server process (stdio or HTTP SSE).
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct McpServerConfig {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
}

impl McpServerConfig {
    pub fn new(name: impl Into<String>, command: impl Into<String>, args: Vec<String>) -> Self {
        Self {
            name: name.into(),
            command: command.into(),
            args,
            env: HashMap::new(),
        }
    }
}

/// Registry of configured MCP servers.
#[derive(Clone, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct McpRegistry {
    servers: HashMap<String, McpServerConfig>,
}

impl McpRegistry {
    pub fn new() -> Self {
        Self {
            servers: HashMap::new(),
        }
    }

    pub fn register_server(&mut self, config: McpServerConfig) {
        self.servers.insert(config.name.clone(), config);
    }

    pub fn get_server(&self, name: &str) -> Option<&McpServerConfig> {
        self.servers.get(name)
    }

    pub fn all_servers(&self) -> Vec<&McpServerConfig> {
        self.servers.values().collect()
    }
}
