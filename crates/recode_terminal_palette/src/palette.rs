//! Floating Command Palette overlay, mode prefixes, and ranked fuzzy search results.

use crate::fuzzy::{fuzzy_match, FuzzyMatchResult};
use serde::{Deserialize, Serialize};

/// Classification of a command palette item.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize)]
pub enum PaletteItemKind {
    Command,
    File,
    Symbol,
    LineJump,
}

/// An executable command or navigable entry in the palette.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct PaletteItem {
    pub id: String,
    pub title: String,
    pub detail: Option<String>,
    pub shortcut: Option<String>,
    pub kind: PaletteItemKind,
}

impl PaletteItem {
    pub fn new(
        id: impl Into<String>,
        title: impl Into<String>,
        kind: PaletteItemKind,
        shortcut: Option<&str>,
    ) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            detail: None,
            shortcut: shortcut.map(|s| s.to_string()),
            kind,
        }
    }
}

/// The state of the Command Palette modal overlay.
#[derive(Clone, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct CommandPalette {
    pub is_open: bool,
    pub query: String,
    items: Vec<PaletteItem>,
    pub selected_index: usize,
}

impl CommandPalette {
    pub fn new() -> Self {
        Self {
            is_open: false,
            query: String::new(),
            items: Vec::new(),
            selected_index: 0,
        }
    }

    /// Registers available items in the palette.
    pub fn set_items(&mut self, items: Vec<PaletteItem>) {
        self.items = items;
        self.selected_index = 0;
    }

    /// Opens the palette with an optional initial prefix (`>` for commands, `:` for lines, `@` for symbols).
    pub fn open(&mut self, initial_prefix: Option<&str>) {
        self.is_open = true;
        self.query = initial_prefix.unwrap_or("").to_string();
        self.selected_index = 0;
    }

    /// Dismisses the palette (Escape).
    pub fn close(&mut self) {
        self.is_open = false;
        self.query.clear();
        self.selected_index = 0;
    }

    /// Updates the search query string.
    pub fn set_query(&mut self, query: &str) {
        self.query = query.to_string();
        self.selected_index = 0;
    }

    /// Returns ranked candidates matching the query, with their fuzzy match score and highlight indices.
    pub fn filtered_results(&self) -> Vec<(PaletteItem, FuzzyMatchResult)> {
        let clean_query = self.query.trim().trim_start_matches(['>', ':', '@']).trim();

        let mut matches: Vec<(PaletteItem, FuzzyMatchResult)> = self
            .items
            .iter()
            .filter_map(|item| {
                let res = fuzzy_match(clean_query, &item.title)?;
                Some((item.clone(), res))
            })
            .collect();

        // Sort descending by score
        matches.sort_by(|a, b| b.1.score.cmp(&a.1.score));
        matches
    }

    /// Keyboard Navigation: moves selection down (capped to result count).
    pub fn move_down(&mut self) {
        let count = self.filtered_results().len();
        if count > 0 {
            self.selected_index = (self.selected_index + 1).min(count - 1);
        }
    }

    /// Keyboard Navigation: moves selection up.
    pub fn move_up(&mut self) {
        self.selected_index = self.selected_index.saturating_sub(1);
    }

    /// Returns the currently highlighted item.
    pub fn selected_item(&self) -> Option<PaletteItem> {
        let results = self.filtered_results();
        results.get(self.selected_index).map(|(item, _)| item.clone())
    }
}
