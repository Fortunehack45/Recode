//! Multi-root workspace coordinator and filesystem validation rules.

use crate::tree::FileTree;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Validates a candidate file or directory name against operating system constraints.
pub fn validate_file_name(name: &str) -> Result<(), &'static str> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Name cannot be empty");
    }

    // Windows & POSIX prohibited characters
    const PROHIBITED_CHARS: &[char] = &['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    for ch in PROHIBITED_CHARS {
        if trimmed.contains(*ch) {
            return Err("Name contains invalid characters: / \\ : * ? \" < > |");
        }
    }

    // Windows reserved device names
    let upper = trimmed.to_uppercase();
    const RESERVED_NAMES: &[&str] = &[
        "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7",
        "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];

    let base_name = upper.split('.').next().unwrap_or(&upper);
    if RESERVED_NAMES.contains(&base_name) {
        return Err("Name is a reserved system device name");
    }

    Ok(())
}

/// A workspace consisting of one or more project trees (multi-root workspace).
#[derive(Clone, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct Workspace {
    roots: Vec<FileTree>,
    active_root_index: Option<usize>,
}

impl Workspace {
    /// Creates an empty workspace.
    pub fn new() -> Self {
        Self {
            roots: Vec::new(),
            active_root_index: None,
        }
    }

    /// Adds a root directory to the workspace.
    pub fn add_root(&mut self, name: impl Into<String>, path: PathBuf) {
        let tree = FileTree::new(name, path);
        self.roots.push(tree);
        if self.active_root_index.is_none() {
            self.active_root_index = Some(0);
        }
    }

    /// Number of project roots in the workspace.
    pub fn root_count(&self) -> usize {
        self.roots.len()
    }

    /// Slice of all root file trees.
    pub fn roots(&self) -> &[FileTree] {
        &self.roots
    }

    /// Mutable slice of all root file trees.
    pub fn roots_mut(&mut self) -> &mut [FileTree] {
        &mut self.roots
    }

    /// Accessor for the active root tree.
    pub fn active_tree(&self) -> Option<&FileTree> {
        let idx = self.active_root_index?;
        self.roots.get(idx)
    }

    /// Mutable accessor for the active root tree.
    pub fn active_tree_mut(&mut self) -> Option<&mut FileTree> {
        let idx = self.active_root_index?;
        self.roots.get_mut(idx)
    }

    /// Finds which root tree owns a given path.
    pub fn find_root_index_for_path(&self, path: &Path) -> Option<usize> {
        self.roots
            .iter()
            .position(|r| path.starts_with(&r.root().path))
    }
}
