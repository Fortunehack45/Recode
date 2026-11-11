//! Interactive file tree, projection of visible rows, and keyboard navigation.

use crate::entry::{EntryKind, FileEntry, GitStatus};
use crate::sorting::sort_entry_tree;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// A flattened visible row ready for viewport rendering.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct VisibleTreeRow {
    pub path: PathBuf,
    pub relative_path: PathBuf,
    pub name: String,
    pub kind: EntryKind,
    pub depth: usize,
    pub is_expanded: bool,
    pub git_status: GitStatus,
}

/// An interactive file tree maintaining expansion state, sorting, and keyboard navigation.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct FileTree {
    root: FileEntry,
    selected_path: Option<PathBuf>,
}

impl FileTree {
    /// Creates a file tree with an initial root directory.
    pub fn new(root_name: impl Into<String>, root_path: PathBuf) -> Self {
        let mut root = FileEntry::new(
            root_name,
            root_path.clone(),
            PathBuf::new(),
            EntryKind::Directory,
            0,
        );
        root.is_expanded = true;

        Self {
            root,
            selected_path: None,
        }
    }

    /// Accessor for the root entry.
    pub fn root(&self) -> &FileEntry {
        &self.root
    }

    /// Mutable accessor for the root entry.
    pub fn root_mut(&mut self) -> &mut FileEntry {
        &mut self.root
    }

    /// Sorts the entire tree adhering to spec invariants.
    pub fn sort(&mut self) {
        sort_entry_tree(&mut self.root);
    }

    /// Currently selected item path.
    pub fn selected_path(&self) -> Option<&Path> {
        self.selected_path.as_deref()
    }

    /// Sets the selected path.
    pub fn set_selected_path(&mut self, path: Option<PathBuf>) {
        self.selected_path = path;
    }

    /// Projects the visible rows of the tree, obeying folder expansion states.
    pub fn visible_rows(&self) -> Vec<VisibleTreeRow> {
        let mut rows = Vec::new();
        Self::collect_visible(&self.root, &mut rows);
        rows
    }

    fn collect_visible(entry: &FileEntry, out: &mut Vec<VisibleTreeRow>) {
        // Skip root item from list or include if desired; standard behavior is showing children of root
        for child in &entry.children {
            out.push(VisibleTreeRow {
                path: child.path.clone(),
                relative_path: child.relative_path.clone(),
                name: child.name.clone(),
                kind: child.kind,
                depth: child.depth,
                is_expanded: child.is_expanded,
                git_status: child.git_status,
            });

            if child.is_dir() && child.is_expanded {
                Self::collect_visible(child, out);
            }
        }
    }

    /// Toggles the expansion state of a directory.
    pub fn toggle_expand(&mut self, path: &Path) -> bool {
        if let Some(entry) = Self::find_entry_mut(&mut self.root, path) {
            if entry.is_dir() {
                entry.is_expanded = !entry.is_expanded;
                return entry.is_expanded;
            }
        }
        false
    }

    /// Recursively expands or collapses all descendants under a path (Alt+Click).
    pub fn set_expand_recursive(&mut self, path: &Path, expand: bool) {
        if let Some(entry) = Self::find_entry_mut(&mut self.root, path) {
            Self::apply_expand_recursive(entry, expand);
        }
    }

    fn apply_expand_recursive(entry: &mut FileEntry, expand: bool) {
        if entry.is_dir() {
            entry.is_expanded = expand;
            for child in &mut entry.children {
                Self::apply_expand_recursive(child, expand);
            }
        }
    }

    fn find_entry_mut<'a>(current: &'a mut FileEntry, path: &Path) -> Option<&'a mut FileEntry> {
        if current.path == path {
            return Some(current);
        }
        for child in &mut current.children {
            if let Some(found) = Self::find_entry_mut(child, path) {
                return Some(found);
            }
        }
        None
    }

    /// Keyboard Navigation: moves selection down by one visible row.
    pub fn move_down(&mut self) {
        let rows = self.visible_rows();
        if rows.is_empty() {
            return;
        }

        let next_idx = match &self.selected_path {
            Some(sel) => {
                let cur = rows.iter().position(|r| &r.path == sel);
                cur.map_or(0, |i| (i + 1).min(rows.len() - 1))
            }
            None => 0,
        };

        self.selected_path = Some(rows[next_idx].path.clone());
    }

    /// Keyboard Navigation: moves selection up by one visible row.
    pub fn move_up(&mut self) {
        let rows = self.visible_rows();
        if rows.is_empty() {
            return;
        }

        let next_idx = match &self.selected_path {
            Some(sel) => {
                let cur = rows.iter().position(|r| &r.path == sel);
                cur.map_or(0, |i| i.saturating_sub(1))
            }
            None => 0,
        };

        self.selected_path = Some(rows[next_idx].path.clone());
    }

    /// Keyboard Navigation: Right Arrow:
    /// - If on a collapsed folder: expands it.
    /// - If on an expanded folder: moves selection to its first child.
    pub fn handle_right_arrow(&mut self) {
        let Some(sel_path) = self.selected_path.clone() else {
            return;
        };

        let rows = self.visible_rows();
        let Some(row_idx) = rows.iter().position(|r| r.path == sel_path) else {
            return;
        };

        let row = &rows[row_idx];
        if row.kind == EntryKind::Directory {
            if !row.is_expanded {
                self.toggle_expand(&sel_path);
            } else if row_idx + 1 < rows.len() && rows[row_idx + 1].depth > row.depth {
                // Move to first child
                self.selected_path = Some(rows[row_idx + 1].path.clone());
            }
        }
    }

    /// Keyboard Navigation: Left Arrow:
    /// - If on an expanded folder: collapses it.
    /// - If on a collapsed folder or file: moves selection to parent folder.
    pub fn handle_left_arrow(&mut self) {
        let Some(sel_path) = self.selected_path.clone() else {
            return;
        };

        let rows = self.visible_rows();
        let Some(row_idx) = rows.iter().position(|r| r.path == sel_path) else {
            return;
        };

        let row = &rows[row_idx];
        if row.kind == EntryKind::Directory && row.is_expanded {
            self.toggle_expand(&sel_path);
        } else if let Some(parent) = sel_path.parent() {
            // Find parent row
            if let Some(parent_row) = rows.iter().find(|r| r.path == parent) {
                self.selected_path = Some(parent_row.path.clone());
            }
        }
    }
}
