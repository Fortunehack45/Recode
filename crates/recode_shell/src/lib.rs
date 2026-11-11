// Copyright (c) 2026 Recode. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification, or redistribution is strictly prohibited.

//! Recode Core Clean-Room Theming and Layout Shell Engine.
//!
//! Provides design token theme management, responsive docking topology,
//! status bar indicators, tab management, and pane splitting.

pub mod dock;
pub mod geometry;
pub mod tabs;
pub mod theme;

pub use dock::{DockPanel, LayoutTopology};
pub use geometry::{DockConstraints, DockPosition, PointDp, RectDp, SizeDp};
pub use tabs::{PaneNode, TabItem, TabStrip};
pub use theme::{AppTheme, RgbaColor, SemanticColorToken, ThemeEngine};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_theme_color_resolution_and_fallback() {
        let mut theme = AppTheme::new("Custom Dark", true);
        theme.set_token_hex(SemanticColorToken::SurfaceCanvas, "#112233");

        let resolved = theme.resolve(SemanticColorToken::SurfaceCanvas);
        assert_eq!(resolved, RgbaColor::rgb(0x11, 0x22, 0x33));

        // Unset token falls back to intelligent default without crashing
        let fallback = theme.resolve(SemanticColorToken::TextAccent);
        assert_eq!(fallback, RgbaColor::rgb(0x3e, 0x8c, 0xf0));
    }

    #[test]
    fn test_theme_hot_reload_and_safe_json_fallback() {
        let mut engine = ThemeEngine::default();
        let initial_gen = engine.generation();

        // Valid theme JSON
        let valid_json = r#"{"name": "Vibrant", "is_dark": true, "colors": {}}"#;
        assert!(engine.load_from_json(valid_json).is_ok());
        assert_eq!(engine.generation(), initial_gen + 1);
        assert_eq!(engine.theme().name, "Vibrant");

        // Invalid JSON safely falls back to Recode Dark
        let invalid_json = "{ malformed json";
        assert!(engine.load_from_json(invalid_json).is_err());
        assert_eq!(engine.theme().name, "Recode Dark");
    }

    #[test]
    fn test_dock_toggle_and_geometry_bounds() {
        let mut layout = LayoutTopology::new(SizeDp::new(1280.0, 800.0));

        // Initial state: all docks visible
        let left_rect = layout.left_dock_rect().expect("Left dock should be visible");
        assert_eq!(left_rect.width(), 260.0);
        assert_eq!(left_rect.height(), 800.0 - 36.0 - 26.0); // interior height

        // Toggle left dock closed
        layout.left_dock.toggle();
        assert!(layout.left_dock_rect().is_none());

        // Center canvas expands to the left edge (x = 0)
        let center_rect = layout.center_editor_rect();
        assert_eq!(center_rect.origin.x, 0.0);
    }

    #[test]
    fn test_dock_resize_clamping() {
        let mut layout = LayoutTopology::new(SizeDp::new(1000.0, 800.0));

        // Minimum clamp: attempting to resize left dock to 50dp clamps to min_size (180dp)
        layout.left_dock.resize(50.0, 1000.0);
        assert_eq!(layout.left_dock.current_size, 180.0);

        // Maximum clamp: attempting to resize left dock to 800dp clamps to max_fraction (45% of 1000 = 450dp)
        layout.left_dock.resize(800.0, 1000.0);
        assert_eq!(layout.left_dock.current_size, 450.0);
    }

    #[test]
    fn test_tab_focus_shift_on_close() {
        let mut strip = TabStrip::new();
        strip.open_tab("file1.rs", None);
        strip.open_tab("file2.rs", None);
        strip.open_tab("file3.rs", None);

        // file3.rs is active (index 2)
        assert_eq!(strip.active_index(), Some(2));

        // Closing file3.rs (rightmost) shifts focus to left neighbor (file2.rs at index 1)
        strip.close_tab(2);
        assert_eq!(strip.active_index(), Some(1));
        assert_eq!(strip.active_tab().unwrap().title, "file2.rs");

        // Closing file1.rs (index 0) shifts focus to right neighbor (file2.rs, now at index 0)
        strip.close_tab(0);
        assert_eq!(strip.active_index(), Some(0));
        assert_eq!(strip.active_tab().unwrap().title, "file2.rs");
    }

    #[test]
    fn test_tab_drag_reordering() {
        let mut strip = TabStrip::new();
        strip.open_tab("a.rs", None);
        strip.open_tab("b.rs", None);
        strip.open_tab("c.rs", None);

        // Move a.rs (index 0) to index 2
        strip.move_tab(0, 2);
        let titles: Vec<&str> = strip.tabs().iter().map(|t| t.title.as_str()).collect();
        assert_eq!(titles, vec!["b.rs", "c.rs", "a.rs"]);
    }
}
