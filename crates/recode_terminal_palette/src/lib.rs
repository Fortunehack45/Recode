//! Recode Core Clean-Room Terminal Grid, Fuzzy Search, and Command Palette Engine.
//!
//! Provides dynamic PTY cell grid calculations, scrollback history,
//! fuzzy subsequence scoring with word-boundary weighting, and modal overlay state.

pub mod fuzzy;
pub mod palette;
pub mod terminal_grid;

pub use fuzzy::{fuzzy_match, FuzzyMatchResult};
pub use palette::{CommandPalette, PaletteItem, PaletteItemKind};
pub use terminal_grid::{CellAttributes, TerminalCell, TerminalGrid, TerminalTabSession};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_terminal_grid_dimensions_and_wrapping() {
        // Test dimension calculation from pixels: 800px width, 300px height with 8px char width, 18px line height
        let (cols, rows) = TerminalGrid::compute_dimensions(800.0, 300.0, 8.0, 18.0);
        // (800 - 16) / 8 = 98 cols; (300 - 28) / 18 = 15 rows
        assert_eq!(cols, 98);
        assert_eq!(rows, 15);

        // Test grid text writing and wrapping
        let mut grid = TerminalGrid::new(10, 4);
        grid.write_str("0123456789ABC");
        // Row 0 has "0123456789", Row 1 has "ABC"
        assert_eq!(grid.line_to_string(0), "0123456789");
        assert!(grid.line_to_string(1).starts_with("ABC"));
    }

    #[test]
    fn test_fuzzy_matching_acronym_and_prefix() {
        // Exact prefix
        let prefix_match = fuzzy_match("format", "Format Document").expect("Should match prefix");
        assert!(prefix_match.score > 0);
        assert_eq!(prefix_match.match_indices, vec![0, 1, 2, 3, 4, 5]);

        // Acronym / word-boundary initials ("fd" -> "Format Document")
        let acronym_match = fuzzy_match("fd", "Format Document").expect("Should match initials");
        // 'F' at 0 and 'D' at 7
        assert_eq!(acronym_match.match_indices, vec![0, 7]);

        // Non-match
        assert!(fuzzy_match("xyz", "Format Document").is_none());
    }

    #[test]
    fn test_command_palette_navigation_and_selection() {
        let mut palette = CommandPalette::new();
        let items = vec![
            PaletteItem::new("cmd.format", "Editor: Format Document", PaletteItemKind::Command, Some("Shift+Alt+F")),
            PaletteItem::new("cmd.save", "File: Save", PaletteItemKind::Command, Some("Ctrl+S")),
            PaletteItem::new("cmd.settings", "Preferences: Open Settings", PaletteItemKind::Command, Some("Ctrl+,")),
        ];
        palette.set_items(items);

        // Open palette with '>' prefix
        palette.open(Some(">"));
        assert!(palette.is_open);
        assert_eq!(palette.query, ">");

        // Filter for "save"
        palette.set_query("> save");
        let results = palette.filtered_results();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].0.id, "cmd.save");

        // Selection returns the item
        assert_eq!(palette.selected_item().unwrap().id, "cmd.save");

        // Escape closes
        palette.close();
        assert!(!palette.is_open);
    }
}
