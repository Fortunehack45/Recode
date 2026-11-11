//! Recode Core Clean-Room Text Buffer & Editing Engine.
//!
//! Provides coordinate addressing, grapheme-aware navigation, multi-cursor
//! synchronized mutations, atomic undo/redo timelines, and delimiter management.

pub mod buffer;
pub mod editor;
pub mod history;
pub mod point;
pub mod selection;

pub use buffer::{LineEnding, TextLinesBuffer};
pub use editor::{EditorSession, MoveDirection};
pub use history::{HistoryTracker, UndoRecord};
pub use point::{DocPoint, DocSpan};
pub use selection::{CaretSelection, SelectionCollection};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_buffer_initialization() {
        let session = EditorSession::new("");
        assert_eq!(session.buffer().line_count(), 1);
        assert_eq!(session.text(), "");
        assert_eq!(session.selections().len(), 1);
        assert_eq!(session.selections().primary().head, DocPoint::zero());
    }

    #[test]
    fn test_single_and_multi_line_typing() {
        let mut session = EditorSession::new("");
        session.type_text("hello world");
        assert_eq!(session.text(), "hello world");
        assert_eq!(session.selections().primary().head, DocPoint::new(0, 11));

        session.insert_newline();
        session.type_text("second line");
        assert_eq!(session.text(), "hello world\nsecond line");
        assert_eq!(session.selections().primary().head, DocPoint::new(1, 11));
    }

    #[test]
    fn test_bracket_auto_closing_and_step_over() {
        let mut session = EditorSession::new("");
        session.type_char('(');
        // Expect "()" with caret at (0, 1)
        assert_eq!(session.text(), "()");
        assert_eq!(session.selections().primary().head, DocPoint::new(0, 1));

        // Step over with ')'
        session.type_char(')');
        // Expect still "()", caret moved to (0, 2)
        assert_eq!(session.text(), "()");
        assert_eq!(session.selections().primary().head, DocPoint::new(0, 2));
    }

    #[test]
    fn test_selection_bracket_wrapping() {
        let mut session = EditorSession::new("target");
        session.select_all();
        session.type_char('{');
        assert_eq!(session.text(), "{target}");
    }

    #[test]
    fn test_grapheme_aware_emoji_backspace() {
        // Family emoji composed of multiple unicode scalars with ZWJ
        let family_emoji = "👨‍👩‍👧‍👦";
        let mut session = EditorSession::new(family_emoji);
        session.move_cursor(MoveDirection::End, false);

        // Single backspace should delete the entire multi-scalar grapheme cluster
        session.delete_backward();
        assert_eq!(session.text(), "");
    }

    #[test]
    fn test_indent_and_unindent() {
        let mut session = EditorSession::new("line one\nline two");
        session.select_all();
        session.indent();
        assert_eq!(session.text(), "    line one\nline two");

        session.unindent();
        assert_eq!(session.text(), "line one\nline two");
    }

    #[test]
    fn test_curly_brace_expansion() {
        let mut session = EditorSession::new("fn main() {}");
        // Place caret inside { and }
        session.move_cursor(MoveDirection::End, false);
        session.move_cursor(MoveDirection::Left, false);
        assert_eq!(session.selections().primary().head, DocPoint::new(0, 11));

        session.insert_newline();
        assert_eq!(session.text(), "fn main() {\n    \n}");
        assert_eq!(session.selections().primary().head, DocPoint::new(1, 4));
    }

    #[test]
    fn test_multi_cursor_editing() {
        let mut session = EditorSession::new("item1\nitem2\nitem3");
        // Move to start of line 1
        session.move_cursor(MoveDirection::DocStart, false);
        // Add cursors on line 2 and line 3
        session.add_cursor_below();
        session.add_cursor_below();

        assert_eq!(session.selections().len(), 3);

        session.type_text("prefix_");
        assert_eq!(session.text(), "prefix_item1\nprefix_item2\nprefix_item3");
    }

    #[test]
    fn test_multi_cursor_overlap_merge() {
        let mut session = EditorSession::new("abcdefghij");
        // Add overlapping selections: 0..4 and 2..6
        session.selections_mut_for_test().add(CaretSelection::new(
            DocPoint::new(0, 0),
            DocPoint::new(0, 4),
        ));
        session.selections_mut_for_test().add(CaretSelection::new(
            DocPoint::new(0, 2),
            DocPoint::new(0, 6),
        ));

        // Invariant: overlapping selections merge into a single span 0..6
        assert_eq!(session.selections().len(), 1);
        assert_eq!(session.selections().primary().start(), DocPoint::new(0, 0));
        assert_eq!(session.selections().primary().end(), DocPoint::new(0, 6));
    }

    #[test]
    fn test_duplicate_and_delete_lines() {
        let mut session = EditorSession::new("hello");
        session.duplicate_lines_down();
        assert_eq!(session.text(), "hello\nhello");

        session.delete_line();
        assert_eq!(session.text(), "hello");
    }

    #[test]
    fn test_toggle_line_comment() {
        let mut session = EditorSession::new("let x = 10;");
        session.toggle_line_comment("//");
        assert_eq!(session.text(), "// let x = 10;");

        session.toggle_line_comment("//");
        assert_eq!(session.text(), "let x = 10;");
    }

    #[test]
    fn test_undo_and_redo_parity() {
        let initial_text = "original state";
        let mut session = EditorSession::new(initial_text);

        session.select_all();
        session.type_text("modified state");
        assert_eq!(session.text(), "modified state");

        // Undo restores exact initial text
        assert!(session.apply_undo());
        assert_eq!(session.text(), initial_text);

        // Redo restores modified text
        assert!(session.apply_redo());
        assert_eq!(session.text(), "modified state");
    }
}

#[cfg(test)]
impl EditorSession {
    pub fn selections_mut_for_test(&mut self) -> &mut SelectionCollection {
        &mut self.selections
    }
}
