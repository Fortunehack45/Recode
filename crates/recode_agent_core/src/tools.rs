//! Tool declarations, execution state tracking, and core tools suite.

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;

/// Lifecycle execution status of a tool invocation.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize)]
pub enum ToolCallStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Denied,
}

/// An inline tool invocation emitted by the model during a turn.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: Value,
    pub status: ToolCallStatus,
    pub output: Option<String>,
}

impl ToolCall {
    pub fn new(id: impl Into<String>, name: impl Into<String>, arguments: Value) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            arguments,
            status: ToolCallStatus::Pending,
            output: None,
        }
    }

    pub fn complete(&mut self, output: impl Into<String>) {
        self.status = ToolCallStatus::Completed;
        self.output = Some(output.into());
    }

    pub fn fail(&mut self, error_message: impl Into<String>) {
        self.status = ToolCallStatus::Failed;
        self.output = Some(error_message.into());
    }
}

/// Schema definition for a tool available to the model.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: Value,
    pub requires_approval: bool,
}

impl ToolDefinition {
    pub fn new(
        name: impl Into<String>,
        description: impl Into<String>,
        parameters: Value,
        requires_approval: bool,
    ) -> Self {
        Self {
            name: name.into(),
            description: description.into(),
            parameters,
            requires_approval,
        }
    }
}

/// Registry of core tools and external MCP tools.
#[derive(Clone, PartialEq, Eq, Debug, Default)]
pub struct ToolRegistry {
    tools: HashMap<String, ToolDefinition>,
}

impl ToolRegistry {
    /// Creates a tool registry pre-populated with standard core tools.
    pub fn with_core_tools() -> Self {
        let mut reg = Self {
            tools: HashMap::new(),
        };

        reg.register(ToolDefinition::new(
            "read_file",
            "Reads the entire contents of a file within the workspace.",
            json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Absolute or relative file path" }
                },
                "required": ["path"]
            }),
            false,
        ));

        reg.register(ToolDefinition::new(
            "write_file",
            "Writes or overwrites file content.",
            json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" },
                    "content": { "type": "string" }
                },
                "required": ["path", "content"]
            }),
            true,
        ));

        reg.register(ToolDefinition::new(
            "edit_file",
            "Surgically replaces a target text block with new content.",
            json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" },
                    "target": { "type": "string" },
                    "replacement": { "type": "string" }
                },
                "required": ["path", "target", "replacement"]
            }),
            true,
        ));

        reg.register(ToolDefinition::new(
            "list_directory",
            "Lists entries in a workspace folder.",
            json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" }
                },
                "required": ["path"]
            }),
            false,
        ));

        reg.register(ToolDefinition::new(
            "run_command",
            "Executes a shell command in the project directory.",
            json!({
                "type": "object",
                "properties": {
                    "command": { "type": "string" }
                },
                "required": ["command"]
            }),
            true,
        ));

        // 3D Studio & Game Development Tools (Blender & Unreal Engine 5)
        reg.register(ToolDefinition::new(
            "blender_setup_lighting",
            "Configures professional 4-tier studio lighting (Key, Fill, Rim, HDRI) with AgX color management.",
            json!({
                "type": "object",
                "properties": {
                    "keyEnergy": { "type": "number" },
                    "fillEnergy": { "type": "number" },
                    "rimEnergy": { "type": "number" },
                    "useAgX": { "type": "boolean" }
                }
            }),
            false,
        ));

        reg.register(ToolDefinition::new(
            "blender_setup_camera",
            "Configures cinematic physical camera optics (focal length, aperture f-stop, bokeh depth of field).",
            json!({
                "type": "object",
                "properties": {
                    "focalLength": { "type": "number" },
                    "fstop": { "type": "number" },
                    "targetObject": { "type": "string" }
                }
            }),
            false,
        ));

        reg.register(ToolDefinition::new(
            "blender_assign_material",
            "Assigns physically-based PBR materials (Principled BSDF) with metallic, roughness, and subsurface scattering.",
            json!({
                "type": "object",
                "properties": {
                    "objectName": { "type": "string" },
                    "materialName": { "type": "string" },
                    "metallic": { "type": "number" },
                    "roughness": { "type": "number" },
                    "subsurface": { "type": "number" }
                },
                "required": ["objectName"]
            }),
            false,
        ));

        reg.register(ToolDefinition::new(
            "unreal_setup_lighting",
            "Sets up realistic environment lighting in UE5 with Lumen Dynamic GI, Directional Sunlight (Lux), and Volumetric Fog.",
            json!({
                "type": "object",
                "properties": {
                    "sunIntensityLux": { "type": "number" },
                    "sunTemperatureKelvin": { "type": "number" },
                    "enableVolumetricFog": { "type": "boolean" }
                }
            }),
            false,
        ));

        reg.register(ToolDefinition::new(
            "unreal_configure_physics",
            "Configures realistic rigid-body physics, collision presets, and mass on an Actor in Unreal Engine 5.",
            json!({
                "type": "object",
                "properties": {
                    "actorName": { "type": "string" },
                    "simulatePhysics": { "type": "boolean" },
                    "collisionProfile": { "type": "string" },
                    "massKg": { "type": "number" }
                },
                "required": ["actorName"]
            }),
            false,
        ));

        reg
    }

    /// Registers a tool definition.
    pub fn register(&mut self, tool: ToolDefinition) {
        self.tools.insert(tool.name.clone(), tool);
    }

    /// Retrieves a tool definition by name.
    pub fn get(&self, name: &str) -> Option<&ToolDefinition> {
        self.tools.get(name)
    }

    /// Returns a slice-like collection of all registered tools.
    pub fn all(&self) -> Vec<&ToolDefinition> {
        self.tools.values().collect()
    }
}
