//! Reversible edit history with typing coalescing and multi-cursor preservation.

use crate::point::DocSpan;
use crate::selection::CaretSelection;
use smallvec::SmallVec;

/// A reversible record of an atomic editing transaction.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct UndoRecord {
    /// Text spans that were deleted or replaced during this edit, along with original text.
    pub deleted_spans: SmallVec<[(DocSpan, String); 2]>,
    /// Text spans that were newly inserted during this edit, along with inserted text.
    pub inserted_spans: SmallVec<[(DocSpan, String); 2]>,
    /// Selection states prior to the edit.
    pub before_selections: SmallVec<[CaretSelection; 2]>,
    /// Selection states immediately following the edit.
    pub after_selections: SmallVec<[CaretSelection; 2]>,
    /// Whether this record represents a continuous single-character typing action that can coalesce.
    pub is_typing: bool,
}

impl UndoRecord {
    /// Attempts to coalesce an incoming typing edit into this record.
    pub fn try_coalesce(&mut self, next: &UndoRecord) -> bool {
        if !self.is_typing || !next.is_typing {
            return false;
        }

        // Single cursor typing continuation check
        if self.inserted_spans.len() == 1
            && next.inserted_spans.len() == 1
            && self.deleted_spans.is_empty()
            && next.deleted_spans.is_empty()
        {
            let (self_span, self_text) = &mut self.inserted_spans[0];
            let (next_span, next_text) = &next.inserted_spans[0];

            // If the next edit starts exactly where this edit ended
            if next_span.start == self_span.end {
                self_span.end = next_span.end;
                self_text.push_str(next_text);
                self.after_selections = next.after_selections.clone();
                return true;
            }
        }

        false
    }
}

/// Tracks history timeline for undo and redo operations.
#[derive(Clone, PartialEq, Eq, Debug, Default)]
pub struct HistoryTracker {
    undo_stack: Vec<UndoRecord>,
    redo_stack: Vec<UndoRecord>,
    max_history_depth: usize,
}

impl HistoryTracker {
    /// Creates a new history tracker with a default history depth limit.
    pub fn new() -> Self {
        Self {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
            max_history_depth: 10_000,
        }
    }

    /// Records a new edit into the timeline. Clears redo history.
    pub fn push(&mut self, record: UndoRecord) {
        self.redo_stack.clear();

        if let Some(last) = self.undo_stack.last_mut() {
            if last.try_coalesce(&record) {
                return;
            }
        }

        self.undo_stack.push(record);
        if self.undo_stack.len() > self.max_history_depth {
            self.undo_stack.remove(0);
        }
    }

    /// Pops the top record from the undo stack and moves it to redo.
    pub fn undo(&mut self) -> Option<UndoRecord> {
        let record = self.undo_stack.pop()?;
        self.redo_stack.push(record.clone());
        Some(record)
    }

    /// Pops the top record from the redo stack and moves it to undo.
    pub fn redo(&mut self) -> Option<UndoRecord> {
        let record = self.redo_stack.pop()?;
        self.undo_stack.push(record.clone());
        Some(record)
    }

    /// Returns `true` if there are actions that can be undone.
    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }

    /// Returns `true` if there are actions that can be redone.
    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }

    /// Clears both undo and redo stacks.
    pub fn clear(&mut self) {
        self.undo_stack.clear();
        self.redo_stack.clear();
    }
}
