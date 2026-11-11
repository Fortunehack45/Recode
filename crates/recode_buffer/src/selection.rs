//! Caret selections and multi-cursor management.

use crate::point::{DocPoint, DocSpan};
use serde::{Deserialize, Serialize};
use smallvec::SmallVec;

/// A cursor selection with an anchor and an active head.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Default, Serialize, Deserialize)]
pub struct CaretSelection {
    /// Stationary point where the selection originated.
    pub anchor: DocPoint,
    /// Dynamic point where the cursor is currently positioned.
    pub head: DocPoint,
}

impl CaretSelection {
    /// Creates a collapsed caret at a specific point.
    pub const fn collapsed(point: DocPoint) -> Self {
        Self {
            anchor: point,
            head: point,
        }
    }

    /// Creates a range selection from anchor to head.
    pub const fn new(anchor: DocPoint, head: DocPoint) -> Self {
        Self { anchor, head }
    }

    /// Whether this selection is a collapsed single-point caret.
    pub fn is_collapsed(&self) -> bool {
        self.anchor == self.head
    }

    /// Returns the normalized span represented by this selection.
    pub fn span(&self) -> DocSpan {
        DocSpan::new(self.anchor, self.head).normalized()
    }

    /// Returns the minimum point (earliest in document).
    pub fn start(&self) -> DocPoint {
        self.anchor.min(self.head)
    }

    /// Returns the maximum point (latest in document).
    pub fn end(&self) -> DocPoint {
        self.anchor.max(self.head)
    }

    /// Checks if this selection is directed backward (head before anchor).
    pub fn is_backward(&self) -> bool {
        self.head < self.anchor
    }
}

/// A collection of one or more caret selections maintaining the invariant:
/// Selections are always sorted by position, and no selections overlap or touch.
#[derive(Clone, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct SelectionCollection {
    selections: SmallVec<[CaretSelection; 2]>,
    primary_index: usize,
}

impl SelectionCollection {
    /// Creates a selection collection with a single collapsed caret at origin (0:0).
    pub fn single_at_origin() -> Self {
        let mut col = Self {
            selections: SmallVec::new(),
            primary_index: 0,
        };
        col.selections.push(CaretSelection::collapsed(DocPoint::zero()));
        col
    }

    /// Creates a selection collection from an initial selection.
    pub fn single(selection: CaretSelection) -> Self {
        let mut col = Self {
            selections: SmallVec::new(),
            primary_index: 0,
        };
        col.selections.push(selection);
        col
    }

    /// Returns the primary active selection.
    pub fn primary(&self) -> CaretSelection {
        if self.selections.is_empty() {
            CaretSelection::collapsed(DocPoint::zero())
        } else {
            self.selections[self.primary_index.min(self.selections.len() - 1)]
        }
    }

    /// Returns an immutable slice of all selections.
    pub fn as_slice(&self) -> &[CaretSelection] {
        &self.selections
    }

    /// Returns the count of active carets.
    pub fn len(&self) -> usize {
        self.selections.len()
    }

    /// Whether there are no carets (should not happen in valid state).
    pub fn is_empty(&self) -> bool {
        self.selections.is_empty()
    }

    /// Sets a single selection, clearing all others.
    pub fn set_single(&mut self, selection: CaretSelection) {
        self.selections.clear();
        self.selections.push(selection);
        self.primary_index = 0;
    }

    /// Adds a new selection and automatically normalizes / merges overlapping selections.
    pub fn add(&mut self, selection: CaretSelection) {
        self.selections.push(selection);
        self.normalize();
    }

    /// Replaces the selections and normalizes.
    pub fn set_all(&mut self, list: &[CaretSelection]) {
        self.selections.clear();
        if list.is_empty() {
            self.selections.push(CaretSelection::collapsed(DocPoint::zero()));
        } else {
            self.selections.extend_from_slice(list);
            self.normalize();
        }
    }

    /// Normalizes selections: sorts them by document position and merges any that overlap or touch.
    pub fn normalize(&mut self) {
        if self.selections.len() <= 1 {
            if self.selections.is_empty() {
                self.selections.push(CaretSelection::collapsed(DocPoint::zero()));
            }
            self.primary_index = 0;
            return;
        }

        // Sort by start point, then end point
        self.selections.sort_by(|a, b| {
            let a_start = a.start();
            let b_start = b.start();
            match a_start.cmp(&b_start) {
                std::cmp::Ordering::Equal => a.end().cmp(&b.end()),
                ord => ord,
            }
        });

        let mut merged = SmallVec::<[CaretSelection; 2]>::new();
        let mut iter = self.selections.iter();
        let mut current = *iter.next().unwrap();

        for next in iter {
            let cur_span = current.span();
            let next_span = next.span();

            if cur_span.overlaps_or_touches(&next_span) {
                // Merge spans
                let union_span = cur_span.merge(&next_span);
                // Keep the directional intention of the latter cursor
                current = if next.is_backward() {
                    CaretSelection::new(union_span.end, union_span.start)
                } else {
                    CaretSelection::new(union_span.start, union_span.end)
                };
            } else {
                merged.push(current);
                current = *next;
            }
        }
        merged.push(current);
        self.selections = merged;
        self.primary_index = self.primary_index.min(self.selections.len() - 1);
    }
}
