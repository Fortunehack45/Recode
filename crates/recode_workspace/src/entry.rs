//! File and directory nodes, git status tracking, and kind classifiers.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// The nature of a filesystem entry.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub enum EntryKind {
    Directory,
    File,
    Symlink,
}

/// Git status indicator for an entry.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub enum GitStatus {
    #[default]
    Clean,
    Modified,
    Untracked,
    Added,
    Deleted,
    Conflicted,
    Ignored,
}

impl GitStatus {
    /// Single-character badge symbol as specified in `spec/workspace.md`.
    pub const fn badge(&self) -> &'static str {
        match self {
            Self::Clean => "",
            Self::Modified => "M",
            Self::Untracked => "U",
            Self::Added => "A",
            Self::Deleted => "D",
            Self::Conflicted => "!",
            Self::Ignored => "",
        }
    }
}

/// A node in the file tree representing a file or directory.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: PathBuf,
    pub relative_path: PathBuf,
    pub kind: EntryKind,
    pub git_status: GitStatus,
    pub is_expanded: bool,
    pub depth: usize,
    pub children: Vec<FileEntry>,
}

impl FileEntry {
    /// Constructs a new file or directory entry.
    pub fn new(
        name: impl Into<String>,
        path: PathBuf,
        relative_path: PathBuf,
        kind: EntryKind,
        depth: usize,
    ) -> Self {
        Self {
            name: name.into(),
            path,
            relative_path,
            kind,
            git_status: GitStatus::Clean,
            is_expanded: false,
            depth,
            children: Vec::new(),
        }
    }

    /// Whether this entry is a directory.
    pub fn is_dir(&self) -> bool {
        matches!(self.kind, EntryKind::Directory)
    }
}
