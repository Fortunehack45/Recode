//! Coordinate primitives for text addressing and ranges.

use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::fmt;

/// A point within a text document, addressing a specific line and column.
/// Both line and column indices are 0-based.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Default, Serialize, Deserialize)]
pub struct DocPoint {
    /// Zero-based line index.
    pub line: usize,
    /// Zero-based column offset (character count within the line).
    pub column: usize,
}

impl DocPoint {
    /// Creates a new document coordinate.
    pub const fn new(line: usize, column: usize) -> Self {
        Self { line, column }
    }

    /// Origin coordinate (line 0, column 0).
    pub const fn zero() -> Self {
        Self { line: 0, column: 0 }
    }
}

impl PartialOrd for DocPoint {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for DocPoint {
    fn cmp(&self, other: &Self) -> Ordering {
        match self.line.cmp(&other.line) {
            Ordering::Equal => self.column.cmp(&other.column),
            ord => ord,
        }
    }
}

impl fmt::Debug for DocPoint {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}", self.line, self.column)
    }
}

impl fmt::Display for DocPoint {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}", self.line + 1, self.column + 1)
    }
}

/// A contiguous range between two document points.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Default, Serialize, Deserialize)]
pub struct DocSpan {
    /// The start point of the range.
    pub start: DocPoint,
    /// The end point of the range.
    pub end: DocPoint,
}

impl DocSpan {
    /// Constructs a span between two coordinates.
    pub const fn new(start: DocPoint, end: DocPoint) -> Self {
        Self { start, end }
    }

    /// Creates an empty span at a single point.
    pub const fn empty(point: DocPoint) -> Self {
        Self {
            start: point,
            end: point,
        }
    }

    /// Returns a normalized span where `start <= end`.
    pub fn normalized(&self) -> Self {
        if self.start <= self.end {
            *self
        } else {
            Self {
                start: self.end,
                end: self.start,
            }
        }
    }

    /// Returns `true` if start equals end.
    pub fn is_empty(&self) -> bool {
        self.start == self.end
    }

    /// Checks if a point falls within this normalized span (inclusive start, exclusive end,
    /// or inclusive end if point equals end).
    pub fn contains_point(&self, point: DocPoint) -> bool {
        let norm = self.normalized();
        point >= norm.start && point <= norm.end
    }

    /// Checks if two spans overlap or touch.
    pub fn overlaps_or_touches(&self, other: &DocSpan) -> bool {
        let a = self.normalized();
        let b = other.normalized();
        a.start <= b.end && b.start <= a.end
    }

    /// Merges two overlapping or touching spans.
    pub fn merge(&self, other: &DocSpan) -> Self {
        let a = self.normalized();
        let b = other.normalized();
        Self {
            start: a.start.min(b.start),
            end: a.end.max(b.end),
        }
    }
}

impl fmt::Debug for DocSpan {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}..{:?}", self.start, self.end)
    }
}
