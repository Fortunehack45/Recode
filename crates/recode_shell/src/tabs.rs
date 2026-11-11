//! Tab management, focus shift on closure, drag reordering, and pane splitting.

use serde::{Deserialize, Serialize};

/// An open document tab in the editor pane.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct TabItem {
    pub id: u64,
    pub title: String,
    pub path: Option<String>,
    pub is_dirty: bool,
}

impl TabItem {
    pub fn new(id: u64, title: impl Into<String>, path: Option<String>) -> Self {
        Self {
            id,
            title: title.into(),
            path,
            is_dirty: false,
        }
    }
}

/// A collection of open tabs in a single pane.
#[derive(Clone, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct TabStrip {
    tabs: Vec<TabItem>,
    active_index: Option<usize>,
    next_id: u64,
}

impl TabStrip {
    pub fn new() -> Self {
        Self {
            tabs: Vec::new(),
            active_index: None,
            next_id: 1,
        }
    }

    /// Number of open tabs.
    pub fn len(&self) -> usize {
        self.tabs.len()
    }

    pub fn is_empty(&self) -> bool {
        self.tabs.is_empty()
    }

    pub fn tabs(&self) -> &[TabItem] {
        &self.tabs
    }

    pub fn active_index(&self) -> Option<usize> {
        self.active_index
    }

    pub fn active_tab(&self) -> Option<&TabItem> {
        let idx = self.active_index?;
        self.tabs.get(idx)
    }

    /// Opens a new tab and activates it immediately.
    pub fn open_tab(&mut self, title: impl Into<String>, path: Option<String>) -> u64 {
        let id = self.next_id;
        self.next_id += 1;

        let item = TabItem::new(id, title, path);
        self.tabs.push(item);
        self.active_index = Some(self.tabs.len() - 1);
        id
    }

    /// Selects a tab by index.
    pub fn select_tab(&mut self, index: usize) {
        if index < self.tabs.len() {
            self.active_index = Some(index);
        }
    }

    /// Closes a tab by index, shifting focus according to the spec:
    /// Prefers right neighbor; if closed tab was rightmost, shifts to left neighbor.
    pub fn close_tab(&mut self, index: usize) -> Option<TabItem> {
        if index >= self.tabs.len() {
            return None;
        }

        let removed = self.tabs.remove(index);

        if self.tabs.is_empty() {
            self.active_index = None;
        } else if let Some(cur_active) = self.active_index {
            if cur_active == index {
                // Shift to right neighbor (now at index) if within bounds, else left neighbor
                let new_active = index.min(self.tabs.len() - 1);
                self.active_index = Some(new_active);
            } else if cur_active > index {
                self.active_index = Some(cur_active - 1);
            }
        }

        Some(removed)
    }

    /// Moves a tab from `from_index` to `to_index` (drag reordering).
    pub fn move_tab(&mut self, from_index: usize, to_index: usize) {
        if from_index >= self.tabs.len() || to_index >= self.tabs.len() || from_index == to_index {
            return;
        }

        let item = self.tabs.remove(from_index);
        self.tabs.insert(to_index, item);

        if let Some(active) = self.active_index {
            if active == from_index {
                self.active_index = Some(to_index);
            } else if from_index < active && to_index >= active {
                self.active_index = Some(active - 1);
            } else if from_index > active && to_index <= active {
                self.active_index = Some(active + 1);
            }
        }
    }
}

/// Recursive binary split tree for editor panes.
#[derive(Clone, PartialEq, Debug)]
pub enum PaneNode {
    Leaf(TabStrip),
    HorizontalSplit {
        left: Box<PaneNode>,
        right: Box<PaneNode>,
        ratio: f32,
    },
    VerticalSplit {
        top: Box<PaneNode>,
        bottom: Box<PaneNode>,
        ratio: f32,
    },
}

impl Default for PaneNode {
    fn default() -> Self {
        Self::Leaf(TabStrip::new())
    }
}
