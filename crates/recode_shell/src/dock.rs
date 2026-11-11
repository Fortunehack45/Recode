//! Dock panel state, responsive window layout calculation, and resize handles.

use crate::geometry::{DockConstraints, DockPosition, PointDp, RectDp, SizeDp};
use serde::{Deserialize, Serialize};

/// A single docking panel (Left, Right, or Bottom).
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub struct DockPanel {
    pub position: DockPosition,
    pub is_visible: bool,
    pub current_size: f32,
    pub constraints: DockConstraints,
}

impl DockPanel {
    pub fn new(position: DockPosition, constraints: DockConstraints) -> Self {
        Self {
            position,
            is_visible: true,
            current_size: constraints.default_size,
            constraints,
        }
    }

    /// Toggles the panel visibility.
    pub fn toggle(&mut self) -> bool {
        self.is_visible = !self.is_visible;
        self.is_visible
    }

    /// Resizes the panel, clamped against min_size and max_fraction of window dimension.
    pub fn resize(&mut self, requested_size: f32, window_dimension: f32) {
        let max_size = window_dimension * self.constraints.max_fraction;
        self.current_size = requested_size.clamp(self.constraints.min_size, max_size);
    }
}

/// Computes pixel-exact rectangular regions for all shell components.
#[derive(Clone, PartialEq, Debug)]
pub struct LayoutTopology {
    pub window_size: SizeDp,
    pub title_bar_height: f32,
    pub status_bar_height: f32,
    pub left_dock: DockPanel,
    pub right_dock: DockPanel,
    pub bottom_dock: DockPanel,
}

impl Default for LayoutTopology {
    fn default() -> Self {
        Self::new(SizeDp::new(1280.0, 800.0))
    }
}

impl LayoutTopology {
    /// Constructs a layout topology with standard geometry values from `spec/theming_layout.md`.
    pub fn new(window_size: SizeDp) -> Self {
        Self {
            window_size,
            title_bar_height: 36.0,
            status_bar_height: 26.0,
            left_dock: DockPanel::new(
                DockPosition::Left,
                DockConstraints::new(260.0, 180.0, 0.45),
            ),
            right_dock: DockPanel::new(
                DockPosition::Right,
                DockConstraints::new(320.0, 220.0, 0.50),
            ),
            bottom_dock: DockPanel::new(
                DockPosition::Bottom,
                DockConstraints::new(220.0, 100.0, 0.70),
            ),
        }
    }

    /// Updates the total window size, enforcing minimum dimensions (640x480).
    pub fn set_window_size(&mut self, size: SizeDp) {
        self.window_size = SizeDp::new(size.width.max(640.0), size.height.max(480.0));
    }

    /// Rect for top Title Bar.
    pub fn title_bar_rect(&self) -> RectDp {
        RectDp::new(
            PointDp::new(0.0, 0.0),
            SizeDp::new(self.window_size.width, self.title_bar_height),
        )
    }

    /// Rect for bottom Status Bar.
    pub fn status_bar_rect(&self) -> RectDp {
        RectDp::new(
            PointDp::new(0.0, self.window_size.height - self.status_bar_height),
            SizeDp::new(self.window_size.width, self.status_bar_height),
        )
    }

    /// Vertical height available between title bar and status bar.
    pub fn interior_height(&self) -> f32 {
        (self.window_size.height - self.title_bar_height - self.status_bar_height).max(0.0)
    }

    /// Rect for Left Dock (Project Panel).
    pub fn left_dock_rect(&self) -> Option<RectDp> {
        if !self.left_dock.is_visible {
            return None;
        }
        let width = self.left_dock.current_size.min(self.window_size.width * 0.45);
        Some(RectDp::new(
            PointDp::new(0.0, self.title_bar_height),
            SizeDp::new(width, self.interior_height()),
        ))
    }

    /// Rect for Right Dock (Agent Panel).
    pub fn right_dock_rect(&self) -> Option<RectDp> {
        if !self.right_dock.is_visible {
            return None;
        }
        let width = self.right_dock.current_size.min(self.window_size.width * 0.50);
        let x = self.window_size.width - width;
        Some(RectDp::new(
            PointDp::new(x, self.title_bar_height),
            SizeDp::new(width, self.interior_height()),
        ))
    }

    /// Rect for Bottom Dock (Terminal Panel).
    pub fn bottom_dock_rect(&self) -> Option<RectDp> {
        if !self.bottom_dock.is_visible {
            return None;
        }
        let left_x = self.left_dock_rect().map_or(0.0, |r| r.right());
        let right_x = self.right_dock_rect().map_or(self.window_size.width, |r| r.origin.x);
        let center_width = (right_x - left_x).max(0.0);

        let height = self.bottom_dock.current_size.min(self.interior_height() * 0.70);
        let y = self.window_size.height - self.status_bar_height - height;

        Some(RectDp::new(
            PointDp::new(left_x, y),
            SizeDp::new(center_width, height),
        ))
    }

    /// Rect for Central Editor Canvas.
    pub fn center_editor_rect(&self) -> RectDp {
        let left_x = self.left_dock_rect().map_or(0.0, |r| r.right());
        let right_x = self.right_dock_rect().map_or(self.window_size.width, |r| r.origin.x);
        let center_width = (right_x - left_x).max(0.0);

        let top_y = self.title_bar_height;
        let bottom_height = self.bottom_dock_rect().map_or(0.0, |r| r.height());
        let available_height = (self.interior_height() - bottom_height).max(0.0);

        RectDp::new(
            PointDp::new(left_x, top_y),
            SizeDp::new(center_width, available_height),
        )
    }

    /// Interactive resize hitbox for a dock divider (5dp hitbox centered on border).
    pub fn resize_hitbox(&self, dock: DockPosition) -> Option<RectDp> {
        match dock {
            DockPosition::Left => {
                let rect = self.left_dock_rect()?;
                Some(RectDp::new(
                    PointDp::new(rect.right() - 2.5, rect.origin.y),
                    SizeDp::new(5.0, rect.height()),
                ))
            }
            DockPosition::Right => {
                let rect = self.right_dock_rect()?;
                Some(RectDp::new(
                    PointDp::new(rect.origin.x - 2.5, rect.origin.y),
                    SizeDp::new(5.0, rect.height()),
                ))
            }
            DockPosition::Bottom => {
                let rect = self.bottom_dock_rect()?;
                Some(RectDp::new(
                    PointDp::new(rect.origin.x, rect.origin.y - 2.5),
                    SizeDp::new(rect.width(), 5.0),
                ))
            }
        }
    }
}
