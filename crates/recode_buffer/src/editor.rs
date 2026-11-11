//! High-level editor session managing typing, commands, multi-caret navigation, and undo/redo.

use crate::buffer::TextLinesBuffer;
use crate::history::{HistoryTracker, UndoRecord};
use crate::point::{DocPoint, DocSpan};
use crate::selection::{CaretSelection, SelectionCollection};
use smallvec::SmallVec;

/// Direction for cursor movement.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum MoveDirection {
    Left,
    Right,
    Up,
    Down,
    WordLeft,
    WordRight,
    Home,
    End,
    DocStart,
    DocEnd,
}

/// An active editor session holding a text buffer, active cursors, and undo history.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct EditorSession {
    buffer: TextLinesBuffer,
    selections: SelectionCollection,
    history: HistoryTracker,
    preferred_columns: Vec<usize>,
    tab_size: usize,
}

impl Default for EditorSession {
    fn default() -> Self {
        Self::new("")
    }
}

impl EditorSession {
    /// Constructs a new editor session with the specified initial text.
    pub fn new(content: &str) -> Self {
        Self {
            buffer: TextLinesBuffer::new(content),
            selections: SelectionCollection::single_at_origin(),
            history: HistoryTracker::new(),
            preferred_columns: vec![0],
            tab_size: 4,
        }
    }

    /// Accessor for the underlying text buffer.
    pub fn buffer(&self) -> &TextLinesBuffer {
        &self.buffer
    }

    /// Accessor for active selections.
    pub fn selections(&self) -> &SelectionCollection {
        &self.selections
    }

    /// Accessor for the active text content.
    pub fn text(&self) -> String {
        self.buffer.full_text()
    }

    /// Sets tab spacing size (default: 4 spaces).
    pub fn set_tab_size(&mut self, size: usize) {
        self.tab_size = size.max(1);
    }

    /// Types a single printable character at all active carets.
    /// Handles bracket auto-closing, selection wrapping, and step-over.
    pub fn type_char(&mut self, ch: char) {
        // Check for delimiter pairs
        let (open, close) = match ch {
            '(' => (Some('('), Some(')')),
            '[' => (Some('['), Some(']')),
            '{' => (Some('{'), Some('}')),
            '"' => (Some('"'), Some('"')),
            '\'' => (Some('\''), Some('\'')),
            '`' => (Some('`'), Some('`')),
            _ => (None, None),
        };

        // Check if user is typing a closing delimiter to step over an existing one
        if matches!(ch, ')' | ']' | '}' | '"' | '\'' | '`') && self.all_carets_collapsed() {
            let mut can_step_over = true;
            for sel in self.selections.as_slice() {
                let line_str = self.buffer.line_str(sel.head.line);
                let char_at_head = line_str.chars().nth(sel.head.column);
                if char_at_head != Some(ch) {
                    can_step_over = false;
                    break;
                }
            }
            if can_step_over {
                // Step over without inserting
                self.move_cursor(MoveDirection::Right, false);
                return;
            }
        }

        // Check if we should wrap selections
        if let (Some(op), Some(cl)) = (open, close) {
            let any_selected = self.selections.as_slice().iter().any(|s| !s.is_collapsed());
            if any_selected {
                self.wrap_selections(op, cl);
                return;
            } else {
                // Collapsed carets auto-insert pair
                let pair_str = format!("{op}{cl}");
                self.insert_text_internal(&pair_str, true);
                // Step caret inside the pair
                for sel in self.selections.as_slice() {
                    let inside_pt = DocPoint::new(sel.head.line, sel.head.column.saturating_sub(1));
                    self.selections.set_single(CaretSelection::collapsed(inside_pt));
                }
                return;
            }
        }

        // Standard character insertion
        let mut s = String::new();
        s.push(ch);
        self.insert_text_internal(&s, true);
    }

    /// Types arbitrary text into all active carets.
    pub fn type_text(&mut self, text: &str) {
        self.insert_text_internal(text, false);
    }

    fn all_carets_collapsed(&self) -> bool {
        self.selections.as_slice().iter().all(|s| s.is_collapsed())
    }

    fn wrap_selections(&mut self, open: char, close: char) {
        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();
        let mut new_selections = SmallVec::new();

        // Process from bottom to top to avoid invalidating coordinates
        let sorted: Vec<CaretSelection> = self.selections.as_slice().to_vec();

        for sel in sorted.into_iter().rev() {
            let span = sel.span();
            let selected_text = self.buffer.slice_span(span);
            let wrapped = format!("{open}{selected_text}{close}");

            let new_end = self.buffer.replace_span(span, &wrapped);
            deleted_spans.push((span, selected_text.clone()));
            inserted_spans.push((DocSpan::new(span.start, new_end), wrapped));

            // Caret now selects the wrapped text inside
            let inside_start = DocPoint::new(span.start.line, span.start.column + 1);
            let inside_end = DocPoint::new(new_end.line, new_end.column.saturating_sub(1));
            new_selections.push(CaretSelection::new(inside_start, inside_end));
        }

        new_selections.reverse();
        self.selections.set_all(&new_selections);

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: new_selections,
            is_typing: false,
        });
        self.update_preferred_columns();
    }

    fn insert_text_internal(&mut self, text: &str, is_typing: bool) {
        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();
        let mut new_selections = SmallVec::new();

        // Process selections bottom-to-top so earlier line offsets are not shifted prematurely
        let sorted: Vec<CaretSelection> = self.selections.as_slice().to_vec();

        for sel in sorted.into_iter().rev() {
            let span = sel.span();
            let deleted_text = self.buffer.slice_span(span);
            let inserted_end = self.buffer.replace_span(span, text);

            if !deleted_text.is_empty() {
                deleted_spans.push((span, deleted_text));
            }
            inserted_spans.push((DocSpan::new(span.start, inserted_end), text.to_string()));
            new_selections.push(CaretSelection::collapsed(inserted_end));
        }

        new_selections.reverse();
        self.selections.set_all(&new_selections);

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: new_selections,
            is_typing,
        });
        self.update_preferred_columns();
    }

    /// Handles Backspace key: deletes preceding character/selection or unindents.
    pub fn delete_backward(&mut self) {
        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();
        let mut new_selections = SmallVec::new();

        let sorted: Vec<CaretSelection> = self.selections.as_slice().to_vec();

        for sel in sorted.into_iter().rev() {
            let span = if sel.is_collapsed() {
                let prev_pt = self.buffer.grapheme_boundary_before(sel.head);
                DocSpan::new(prev_pt, sel.head)
            } else {
                sel.span()
            };

            if span.is_empty() {
                new_selections.push(sel);
                continue;
            }

            let deleted_text = self.buffer.slice_span(span);
            let end_pt = self.buffer.replace_span(span, "");

            deleted_spans.push((span, deleted_text));
            inserted_spans.push((DocSpan::empty(end_pt), String::new()));
            new_selections.push(CaretSelection::collapsed(end_pt));
        }

        new_selections.reverse();
        self.selections.set_all(&new_selections);

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: new_selections,
            is_typing: false,
        });
        self.update_preferred_columns();
    }

    /// Handles Delete key: deletes character/selection ahead of the cursor.
    pub fn delete_forward(&mut self) {
        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();
        let mut new_selections = SmallVec::new();

        let sorted: Vec<CaretSelection> = self.selections.as_slice().to_vec();

        for sel in sorted.into_iter().rev() {
            let span = if sel.is_collapsed() {
                let next_pt = self.buffer.grapheme_boundary_after(sel.head);
                DocSpan::new(sel.head, next_pt)
            } else {
                sel.span()
            };

            if span.is_empty() {
                new_selections.push(sel);
                continue;
            }

            let deleted_text = self.buffer.slice_span(span);
            let end_pt = self.buffer.replace_span(span, "");

            deleted_spans.push((span, deleted_text));
            inserted_spans.push((DocSpan::empty(end_pt), String::new()));
            new_selections.push(CaretSelection::collapsed(end_pt));
        }

        new_selections.reverse();
        self.selections.set_all(&new_selections);

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: new_selections,
            is_typing: false,
        });
        self.update_preferred_columns();
    }

    /// Deletes word backward (Ctrl+Backspace).
    pub fn delete_word_backward(&mut self) {
        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();
        let mut new_selections = SmallVec::new();

        let sorted: Vec<CaretSelection> = self.selections.as_slice().to_vec();

        for sel in sorted.into_iter().rev() {
            let span = if sel.is_collapsed() {
                let word_pt = self.buffer.word_boundary_before(sel.head);
                DocSpan::new(word_pt, sel.head)
            } else {
                sel.span()
            };

            if span.is_empty() {
                new_selections.push(sel);
                continue;
            }

            let deleted_text = self.buffer.slice_span(span);
            let end_pt = self.buffer.replace_span(span, "");

            deleted_spans.push((span, deleted_text));
            inserted_spans.push((DocSpan::empty(end_pt), String::new()));
            new_selections.push(CaretSelection::collapsed(end_pt));
        }

        new_selections.reverse();
        self.selections.set_all(&new_selections);

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: new_selections,
            is_typing: false,
        });
        self.update_preferred_columns();
    }

    /// Deletes word forward (Ctrl+Delete).
    pub fn delete_word_forward(&mut self) {
        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();
        let mut new_selections = SmallVec::new();

        let sorted: Vec<CaretSelection> = self.selections.as_slice().to_vec();

        for sel in sorted.into_iter().rev() {
            let span = if sel.is_collapsed() {
                let word_pt = self.buffer.word_boundary_after(sel.head);
                DocSpan::new(sel.head, word_pt)
            } else {
                sel.span()
            };

            if span.is_empty() {
                new_selections.push(sel);
                continue;
            }

            let deleted_text = self.buffer.slice_span(span);
            let end_pt = self.buffer.replace_span(span, "");

            deleted_spans.push((span, deleted_text));
            inserted_spans.push((DocSpan::empty(end_pt), String::new()));
            new_selections.push(CaretSelection::collapsed(end_pt));
        }

        new_selections.reverse();
        self.selections.set_all(&new_selections);

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: new_selections,
            is_typing: false,
        });
        self.update_preferred_columns();
    }

    /// Handles Enter/Return: inserts newline with auto-indentation and curly brace expansion.
    pub fn insert_newline(&mut self) {
        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();
        let mut new_selections = SmallVec::new();

        let sorted: Vec<CaretSelection> = self.selections.as_slice().to_vec();

        for sel in sorted.into_iter().rev() {
            let span = sel.span();
            let cur_line = self.buffer.line_str(sel.head.line);

            // Compute inherited indentation
            let indent_len = cur_line.chars().take_while(|c| c.is_whitespace()).count();
            let indent_str: String = cur_line.chars().take(indent_len).collect();

            // Check for brace expansion: caret between '{' and '}'
            let char_before = if sel.head.column > 0 {
                cur_line.chars().nth(sel.head.column - 1)
            } else {
                None
            };
            let char_after = cur_line.chars().nth(sel.head.column);

            if char_before == Some('{') && char_after == Some('}') {
                let extra_indent = " ".repeat(self.tab_size);
                let newline_body = format!("\n{indent_str}{extra_indent}\n{indent_str}");

                let deleted_text = self.buffer.slice_span(span);
                let _ = self.buffer.replace_span(span, &newline_body);

                deleted_spans.push((span, deleted_text));
                inserted_spans.push((
                    DocSpan::new(span.start, DocPoint::new(span.start.line + 2, indent_len)),
                    newline_body,
                ));

                // Position caret on middle indented line
                let caret_pos = DocPoint::new(span.start.line + 1, indent_len + self.tab_size);
                new_selections.push(CaretSelection::collapsed(caret_pos));
            } else {
                // Standard newline with auto-indent
                let newline_body = format!("\n{indent_str}");
                let deleted_text = self.buffer.slice_span(span);
                let end_pt = self.buffer.replace_span(span, &newline_body);

                deleted_spans.push((span, deleted_text));
                inserted_spans.push((DocSpan::new(span.start, end_pt), newline_body));
                new_selections.push(CaretSelection::collapsed(end_pt));
            }
        }

        new_selections.reverse();
        self.selections.set_all(&new_selections);

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: new_selections,
            is_typing: false,
        });
        self.update_preferred_columns();
    }

    /// Indents current line(s) or inserts tab spaces.
    pub fn indent(&mut self) {
        let spaces = " ".repeat(self.tab_size);
        self.insert_text_internal(&spaces, false);
    }

    /// Unindents current line(s) by one tab size.
    pub fn unindent(&mut self) {
        // Find distinct lines touched by selections
        let mut lines: Vec<usize> = Vec::new();
        for sel in self.selections.as_slice() {
            let span = sel.span();
            for l in span.start.line..=span.end.line {
                if !lines.contains(&l) {
                    lines.push(l);
                }
            }
        }
        lines.sort();

        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();

        for &line_idx in lines.iter().rev() {
            let line_str = self.buffer.line_str(line_idx);
            let mut remove_count = 0;
            for ch in line_str.chars().take(self.tab_size) {
                if ch == ' ' {
                    remove_count += 1;
                } else if ch == '\t' {
                    remove_count += 1;
                    break;
                } else {
                    break;
                }
            }

            if remove_count > 0 {
                let span = DocSpan::new(
                    DocPoint::new(line_idx, 0),
                    DocPoint::new(line_idx, remove_count),
                );
                let deleted_text = self.buffer.slice_span(span);
                let end_pt = self.buffer.replace_span(span, "");

                deleted_spans.push((span, deleted_text));
                inserted_spans.push((DocSpan::empty(end_pt), String::new()));
            }
        }

        // Adjust selections
        let mut new_selections = SmallVec::new();
        for sel in self.selections.as_slice() {
            let head_col = sel.head.column.saturating_sub(self.tab_size);
            let anchor_col = sel.anchor.column.saturating_sub(self.tab_size);
            new_selections.push(CaretSelection::new(
                DocPoint::new(sel.anchor.line, anchor_col),
                DocPoint::new(sel.head.line, head_col),
            ));
        }

        self.selections.set_all(&new_selections);

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: new_selections,
            is_typing: false,
        });
        self.update_preferred_columns();
    }

    /// Moves cursors in the given direction.
    pub fn move_cursor(&mut self, direction: MoveDirection, expand_selection: bool) {
        let mut updated = SmallVec::new();

        for (idx, sel) in self.selections.as_slice().iter().enumerate() {
            let target_head = match direction {
                MoveDirection::Left => self.buffer.grapheme_boundary_before(sel.head),
                MoveDirection::Right => self.buffer.grapheme_boundary_after(sel.head),
                MoveDirection::WordLeft => self.buffer.word_boundary_before(sel.head),
                MoveDirection::WordRight => self.buffer.word_boundary_after(sel.head),
                MoveDirection::Up => {
                    if sel.head.line == 0 {
                        DocPoint::new(0, 0)
                    } else {
                        let target_line = sel.head.line - 1;
                        let target_col = self.preferred_columns.get(idx).copied().unwrap_or(sel.head.column);
                        let clamped = self.buffer.clamp_point(DocPoint::new(target_line, target_col));
                        clamped
                    }
                }
                MoveDirection::Down => {
                    let max_line = self.buffer.line_count().saturating_sub(1);
                    if sel.head.line >= max_line {
                        DocPoint::new(max_line, self.buffer.line_char_count(max_line))
                    } else {
                        let target_line = sel.head.line + 1;
                        let target_col = self.preferred_columns.get(idx).copied().unwrap_or(sel.head.column);
                        let clamped = self.buffer.clamp_point(DocPoint::new(target_line, target_col));
                        clamped
                    }
                }
                MoveDirection::Home => {
                    let line_str = self.buffer.line_str(sel.head.line);
                    let first_non_ws = line_str.chars().take_while(|c| c.is_whitespace()).count();
                    if sel.head.column == first_non_ws {
                        DocPoint::new(sel.head.line, 0)
                    } else {
                        DocPoint::new(sel.head.line, first_non_ws)
                    }
                }
                MoveDirection::End => {
                    let line_len = self.buffer.line_char_count(sel.head.line);
                    DocPoint::new(sel.head.line, line_len)
                }
                MoveDirection::DocStart => DocPoint::zero(),
                MoveDirection::DocEnd => {
                    let last_line = self.buffer.line_count().saturating_sub(1);
                    let last_col = self.buffer.line_char_count(last_line);
                    DocPoint::new(last_line, last_col)
                }
            };

            let new_sel = if expand_selection {
                CaretSelection::new(sel.anchor, target_head)
            } else {
                CaretSelection::collapsed(target_head)
            };
            updated.push(new_sel);
        }

        self.selections.set_all(&updated);

        // Update preferred columns for vertical traversal unless moving up/down
        if !matches!(direction, MoveDirection::Up | MoveDirection::Down) {
            self.update_preferred_columns();
        }
    }

    fn update_preferred_columns(&mut self) {
        self.preferred_columns = self
            .selections
            .as_slice()
            .iter()
            .map(|s| s.head.column)
            .collect();
    }

    /// Selects all text in the document (Ctrl+A).
    pub fn select_all(&mut self) {
        let last_line = self.buffer.line_count().saturating_sub(1);
        let last_col = self.buffer.line_char_count(last_line);
        self.selections.set_single(CaretSelection::new(
            DocPoint::zero(),
            DocPoint::new(last_line, last_col),
        ));
        self.update_preferred_columns();
    }

    /// Clones current line(s) downward (Shift+Alt+Down).
    pub fn duplicate_lines_down(&mut self) {
        let sel = self.selections.primary();
        let span = sel.span();

        let mut lines_to_dup = Vec::new();
        for l in span.start.line..=span.end.line {
            lines_to_dup.push(self.buffer.line_str(l).to_string());
        }

        let dup_text = lines_to_dup.join("\n");
        let insert_point = DocPoint::new(
            span.end.line,
            self.buffer.line_char_count(span.end.line),
        );
        let insert_body = format!("\n{dup_text}");

        let new_end = self.buffer.replace_span(DocSpan::empty(insert_point), &insert_body);

        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut new_selections = SmallVec::new();
        new_selections.push(CaretSelection::collapsed(new_end));

        self.history.push(UndoRecord {
            deleted_spans: SmallVec::new(),
            inserted_spans: SmallVec::from_slice(&[(DocSpan::new(insert_point, new_end), insert_body)]),
            before_selections,
            after_selections: new_selections.clone(),
            is_typing: false,
        });

        self.selections.set_all(&new_selections);
        self.update_preferred_columns();
    }

    /// Deletes the entire active line(s) (Ctrl+Shift+K).
    pub fn delete_line(&mut self) {
        let sel = self.selections.primary();
        let span = sel.span();

        let start_line = span.start.line;
        let end_line = span.end.line;

        let delete_span = if end_line + 1 < self.buffer.line_count() {
            DocSpan::new(DocPoint::new(start_line, 0), DocPoint::new(end_line + 1, 0))
        } else if start_line > 0 {
            DocSpan::new(
                DocPoint::new(start_line - 1, self.buffer.line_char_count(start_line - 1)),
                DocPoint::new(end_line, self.buffer.line_char_count(end_line)),
            )
        } else {
            DocSpan::new(
                DocPoint::new(0, 0),
                DocPoint::new(0, self.buffer.line_char_count(0)),
            )
        };

        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let deleted_text = self.buffer.slice_span(delete_span);
        let end_pt = self.buffer.replace_span(delete_span, "");

        let mut new_selections = SmallVec::new();
        new_selections.push(CaretSelection::collapsed(end_pt));

        self.history.push(UndoRecord {
            deleted_spans: SmallVec::from_slice(&[(delete_span, deleted_text)]),
            inserted_spans: SmallVec::new(),
            before_selections,
            after_selections: new_selections.clone(),
            is_typing: false,
        });

        self.selections.set_all(&new_selections);
        self.update_preferred_columns();
    }

    /// Toggles single-line comment at the start of each selected line (Ctrl+/).
    pub fn toggle_line_comment(&mut self, comment_prefix: &str) {
        let sel = self.selections.primary();
        let span = sel.span();

        let prefix_with_space = format!("{comment_prefix} ");
        let mut all_commented = true;

        for l in span.start.line..=span.end.line {
            let line_str = self.buffer.line_str(l).trim_start();
            if !line_str.starts_with(comment_prefix) {
                all_commented = false;
                break;
            }
        }

        let before_selections = SmallVec::from_slice(self.selections.as_slice());
        let mut deleted_spans = SmallVec::new();
        let mut inserted_spans = SmallVec::new();

        for l in (span.start.line..=span.end.line).rev() {
            let line_str = self.buffer.line_str(l);
            let first_char_idx = line_str.chars().take_while(|c| c.is_whitespace()).count();

            if all_commented {
                // Remove comment prefix
                let rest: String = line_str.chars().skip(first_char_idx).collect();
                let chars_to_remove = if rest.starts_with(&prefix_with_space) {
                    prefix_with_space.chars().count()
                } else {
                    comment_prefix.chars().count()
                };

                let remove_span = DocSpan::new(
                    DocPoint::new(l, first_char_idx),
                    DocPoint::new(l, first_char_idx + chars_to_remove),
                );
                let deleted_text = self.buffer.slice_span(remove_span);
                self.buffer.replace_span(remove_span, "");
                deleted_spans.push((remove_span, deleted_text));
            } else {
                // Add comment prefix
                let insert_pt = DocPoint::new(l, first_char_idx);
                let end_pt = self.buffer.replace_span(DocSpan::empty(insert_pt), &prefix_with_space);
                inserted_spans.push((DocSpan::new(insert_pt, end_pt), prefix_with_space.clone()));
            }
        }

        self.history.push(UndoRecord {
            deleted_spans,
            inserted_spans,
            before_selections,
            after_selections: SmallVec::from_slice(self.selections.as_slice()),
            is_typing: false,
        });
        self.update_preferred_columns();
    }

    /// Adds a cursor 1 line above at the same column (Ctrl+Alt+Up).
    pub fn add_cursor_above(&mut self) {
        let primary = self.selections.primary();
        if primary.head.line > 0 {
            let target_line = primary.head.line - 1;
            let target_col = self.buffer.clamp_point(DocPoint::new(target_line, primary.head.column));
            self.selections.add(CaretSelection::collapsed(target_col));
            self.update_preferred_columns();
        }
    }

    /// Adds a cursor 1 line below at the same column (Ctrl+Alt+Down).
    pub fn add_cursor_below(&mut self) {
        let primary = self.selections.primary();
        let max_line = self.buffer.line_count().saturating_sub(1);
        if primary.head.line < max_line {
            let target_line = primary.head.line + 1;
            let target_col = self.buffer.clamp_point(DocPoint::new(target_line, primary.head.column));
            self.selections.add(CaretSelection::collapsed(target_col));
            self.update_preferred_columns();
        }
    }

    /// Applies Undo, restoring prior buffer text and caret positions.
    pub fn apply_undo(&mut self) -> bool {
        let Some(record) = self.history.undo() else {
            return false;
        };

        // Revert inserted spans in reverse order
        for (span, _) in record.inserted_spans.iter().rev() {
            self.buffer.replace_span(*span, "");
        }

        // Reinsert deleted spans
        for (span, text) in record.deleted_spans.iter() {
            self.buffer.replace_span(DocSpan::empty(span.start), text);
        }

        self.selections.set_all(&record.before_selections);
        self.update_preferred_columns();
        true
    }

    /// Applies Redo, reapplying the edit.
    pub fn apply_redo(&mut self) -> bool {
        let Some(record) = self.history.redo() else {
            return false;
        };

        // Reapply deletions
        for (span, _) in record.deleted_spans.iter().rev() {
            self.buffer.replace_span(*span, "");
        }

        // Reapply insertions
        for (span, text) in record.inserted_spans.iter() {
            self.buffer.replace_span(DocSpan::empty(span.start), text);
        }

        self.selections.set_all(&record.after_selections);
        self.update_preferred_columns();
        true
    }
}
