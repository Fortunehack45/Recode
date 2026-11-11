//! Layout geometry primitives and dock dimensions in density-independent pixels (dp).

use serde::{Deserialize, Serialize};

/// Point coordinate in density-independent pixels.
#[derive(Clone, Copy, PartialEq, Debug, Default, Serialize, Deserialize)]
pub struct PointDp {
    pub x: f32,
    pub y: f32,
}

impl PointDp {
    pub const fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }
}

/// 2D dimensions in density-independent pixels.
#[derive(Clone, Copy, PartialEq, Debug, Default, Serialize, Deserialize)]
pub struct SizeDp {
    pub width: f32,
    pub height: f32,
}

impl SizeDp {
    pub const fn new(width: f32, height: f32) -> Self {
        Self { width, height }
    }
}

/// A bounding box in density-independent pixels.
#[derive(Clone, Copy, PartialEq, Debug, Default, Serialize, Deserialize)]
pub struct RectDp {
    pub origin: PointDp,
    pub size: SizeDp,
}

impl RectDp {
    pub const fn new(origin: PointDp, size: SizeDp) -> Self {
        Self { origin, size }
    }

    pub fn x(&self) -> f32 {
        self.origin.x
    }

    pub fn y(&self) -> f32 {
        self.origin.y
    }

    pub fn width(&self) -> f32 {
        self.size.width
    }

    pub fn height(&self) -> f32 {
        self.size.height
    }

    pub fn right(&self) -> f32 {
        self.origin.x + self.size.width
    }

    pub fn bottom(&self) -> f32 {
        self.origin.y + self.size.height
    }

    pub fn contains(&self, point: PointDp) -> bool {
        point.x >= self.origin.x
            && point.x <= self.right()
            && point.y >= self.origin.y
            && point.y <= self.bottom()
    }
}

/// Position of a docking panel around the central workspace.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize)]
pub enum DockPosition {
    Left,
    Right,
    Bottom,
}

/// Sizing constraints for a dock panel.
#[derive(Clone, Copy, PartialEq, Debug, Serialize, Deserialize)]
pub struct DockConstraints {
    pub default_size: f32,
    pub min_size: f32,
    pub max_fraction: f32,
}

impl DockConstraints {
    pub const fn new(default_size: f32, min_size: f32, max_fraction: f32) -> Self {
        Self {
            default_size,
            min_size,
            max_fraction,
        }
    }
}
