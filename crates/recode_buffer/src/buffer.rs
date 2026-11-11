//! Underlying text storage, coordinate mapping, and grapheme traversal.

use crate::point::{DocPoint, DocSpan};
use unicode_segmentation::UnicodeSegmentation;

/// The line ending style used by the document.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum LineEnding {
    /// Unix standard LF (`\n`).
    Lf,
    /// Windows standard CRLF (`\r\n`).
    Crlf,
}

impl LineEnding {
    /// String representation of this line ending.
    pub const fn as_str(&self) -> &'static str {
        match self {
            Self::Lf => "\n",
            Self::Crlf => "\r\n",
        }
    }
}

/// A line-indexed text buffer supporting high-precision coordinate addressing,
/// grapheme cluster boundary navigation, and atomic slice replacements.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct TextLinesBuffer {
    lines: Vec<String>,
    line_ending: LineEnding,
}

impl Default for TextLinesBuffer {
    fn default() -> Self {
        Self::new("")
    }
}

impl TextLinesBuffer {
    /// Constructs a new text buffer from string content.
    pub fn new(content: &str) -> Self {
        let line_ending = if content.contains("\r\n") {
            LineEnding::Crlf
        } else {
            LineEnding::Lf
        };

        let mut lines = Vec::new();
        let normalized = content.replace("\r\n", "\n");
        for line in normalized.split('\n') {
            lines.push(line.to_string());
        }

        if lines.is_empty() {
            lines.push(String::new());
        }

        Self { lines, line_ending }
    }

    /// Returns the active line ending style.
    pub fn line_ending(&self) -> LineEnding {
        self.line_ending
    }

    /// Sets the active line ending style.
    pub fn set_line_ending(&mut self, ending: LineEnding) {
        self.line_ending = ending;
    }

    /// Total number of lines in the buffer (always at least 1).
    pub fn line_count(&self) -> usize {
        self.lines.len()
    }

    /// Returns a reference to the content of a specific line (excluding newline).
    pub fn line_str(&self, line: usize) -> &str {
        if line < self.lines.len() {
            &self.lines[line]
        } else {
            ""
        }
    }

    /// Returns the character length of a specific line.
    pub fn line_char_count(&self, line: usize) -> usize {
        if line < self.lines.len() {
            self.lines[line].chars().count()
        } else {
            0
        }
    }

    /// Reconstructs the entire document text into a single String.
    pub fn full_text(&self) -> String {
        self.lines.join(self.line_ending.as_str())
    }

    /// Clamps a given point so it lies strictly within valid document boundaries.
    pub fn clamp_point(&self, point: DocPoint) -> DocPoint {
        let max_line = self.lines.len().saturating_sub(1);
        let line = point.line.min(max_line);
        let max_col = self.line_char_count(line);
        let column = point.column.min(max_col);
        DocPoint::new(line, column)
    }

    /// Returns the linear character offset corresponding to a document point.
    pub fn point_to_offset(&self, point: DocPoint) -> usize {
        let pt = self.clamp_point(point);
        let mut offset = 0;
        let newline_len = 1; // logical char count for newline

        for (idx, line) in self.lines.iter().enumerate() {
            if idx == pt.line {
                let col_chars = line.chars().take(pt.column).count();
                offset += col_chars;
                break;
            } else {
                offset += line.chars().count() + newline_len;
            }
        }
        offset
    }

    /// Converts a linear character offset into a document point coordinate.
    pub fn offset_to_point(&self, mut offset: usize) -> DocPoint {
        let newline_len = 1;
        for (line_idx, line) in self.lines.iter().enumerate() {
            let line_chars = line.chars().count();
            if offset <= line_chars {
                return DocPoint::new(line_idx, offset);
            }
            if line_idx + 1 == self.lines.len() {
                return DocPoint::new(line_idx, line_chars);
            }
            offset = offset.saturating_sub(line_chars + newline_len);
        }
        DocPoint::new(self.lines.len().saturating_sub(1), 0)
    }

    /// Extracts text within a normalized span.
    pub fn slice_span(&self, span: DocSpan) -> String {
        let norm = span.normalized();
        let start = self.clamp_point(norm.start);
        let end = self.clamp_point(norm.end);

        if start == end {
            return String::new();
        }

        if start.line == end.line {
            let line = self.line_str(start.line);
            let chars: Vec<char> = line.chars().collect();
            let slice: String = chars[start.column..end.column.min(chars.len())].iter().collect();
            return slice;
        }

        let mut result = Vec::new();

        // First line
        let first_line = self.line_str(start.line);
        let first_chars: Vec<char> = first_line.chars().collect();
        let first_slice: String = first_chars[start.column..].iter().collect();
        result.push(first_slice);

        // Intermediate lines
        for line_idx in (start.line + 1)..end.line {
            result.push(self.lines[line_idx].clone());
        }

        // Last line
        let last_line = self.line_str(end.line);
        let last_chars: Vec<char> = last_line.chars().collect();
        let last_slice: String = last_chars[..end.column.min(last_chars.len())].iter().collect();
        result.push(last_slice);

        result.join(self.line_ending.as_str())
    }

    /// Replaces the content in `span` with `replacement` and returns the end point of the inserted text.
    pub fn replace_span(&mut self, span: DocSpan, replacement: &str) -> DocPoint {
        let norm = span.normalized();
        let start = self.clamp_point(norm.start);
        let end = self.clamp_point(norm.end);

        // Break replacement text into lines
        let normalized_replacement = replacement.replace("\r\n", "\n");
        let rep_lines: Vec<&str> = normalized_replacement.split('\n').collect();

        // Existing text before the start on line start.line
        let start_line = &self.lines[start.line];
        let start_chars: Vec<char> = start_line.chars().collect();
        let prefix: String = start_chars[..start.column.min(start_chars.len())].iter().collect();

        // Existing text after the end on line end.line
        let end_line = &self.lines[end.line];
        let end_chars: Vec<char> = end_line.chars().collect();
        let suffix: String = end_chars[end.column.min(end_chars.len())..].iter().collect();

        if rep_lines.len() == 1 {
            // Single-line replacement
            let mut new_line = prefix;
            new_line.push_str(rep_lines[0]);
            let inserted_col = new_line.chars().count();
            new_line.push_str(&suffix);

            self.lines.drain(start.line..=end.line);
            self.lines.insert(start.line, new_line);

            DocPoint::new(start.line, inserted_col)
        } else {
            // Multi-line replacement
            let mut new_lines = Vec::with_capacity(rep_lines.len());

            // First replacement line
            let mut first = prefix;
            first.push_str(rep_lines[0]);
            new_lines.push(first);

            // Middle lines
            for &mid in &rep_lines[1..rep_lines.len() - 1] {
                new_lines.push(mid.to_string());
            }

            // Last line
            let last_idx = rep_lines.len() - 1;
            let mut last = rep_lines[last_idx].to_string();
            let end_col = last.chars().count();
            last.push_str(&suffix);
            new_lines.push(last);

            let result_end = DocPoint::new(start.line + last_idx, end_col);

            self.lines.drain(start.line..=end.line);
            for (idx, line) in new_lines.into_iter().enumerate() {
                self.lines.insert(start.line + idx, line);
            }

            result_end
        }
    }

    /// Finds the nearest grapheme cluster boundary prior to `point`.
    pub fn grapheme_boundary_before(&self, point: DocPoint) -> DocPoint {
        let pt = self.clamp_point(point);
        if pt.column == 0 {
            if pt.line == 0 {
                return pt;
            }
            let prev_line = pt.line - 1;
            return DocPoint::new(prev_line, self.line_char_count(prev_line));
        }

        let line = self.line_str(pt.line);
        let mut prev_char_idx = 0;
        let mut cur_char_idx = 0;

        for grapheme in line.graphemes(true) {
            let g_chars = grapheme.chars().count();
            if cur_char_idx + g_chars >= pt.column {
                return DocPoint::new(pt.line, cur_char_idx);
            }
            prev_char_idx = cur_char_idx;
            cur_char_idx += g_chars;
        }

        DocPoint::new(pt.line, prev_char_idx)
    }

    /// Finds the nearest grapheme cluster boundary after `point`.
    pub fn grapheme_boundary_after(&self, point: DocPoint) -> DocPoint {
        let pt = self.clamp_point(point);
        let max_col = self.line_char_count(pt.line);

        if pt.column >= max_col {
            if pt.line + 1 < self.lines.len() {
                return DocPoint::new(pt.line + 1, 0);
            }
            return pt;
        }

        let line = self.line_str(pt.line);
        let mut cur_char_idx = 0;

        for grapheme in line.graphemes(true) {
            let g_chars = grapheme.chars().count();
            cur_char_idx += g_chars;
            if cur_char_idx > pt.column {
                return DocPoint::new(pt.line, cur_char_idx);
            }
        }

        DocPoint::new(pt.line, max_col)
    }

    /// Finds previous word boundary before `point`.
    pub fn word_boundary_before(&self, point: DocPoint) -> DocPoint {
        let pt = self.clamp_point(point);
        if pt.column == 0 {
            if pt.line == 0 {
                return pt;
            }
            let prev_line = pt.line - 1;
            return DocPoint::new(prev_line, self.line_char_count(prev_line));
        }

        let line = self.line_str(pt.line);
        let line_prefix: String = line.chars().take(pt.column).collect();
        let words: Vec<(usize, &str)> = line_prefix.split_word_bound_indices().collect();

        if let Some(&(byte_offset, _)) = words.last() {
            let char_offset = line[..byte_offset].chars().count();
            DocPoint::new(pt.line, char_offset)
        } else {
            DocPoint::new(pt.line, 0)
        }
    }

    /// Finds next word boundary after `point`.
    pub fn word_boundary_after(&self, point: DocPoint) -> DocPoint {
        let pt = self.clamp_point(point);
        let max_col = self.line_char_count(pt.line);

        if pt.column >= max_col {
            if pt.line + 1 < self.lines.len() {
                return DocPoint::new(pt.line + 1, 0);
            }
            return pt;
        }

        let line = self.line_str(pt.line);
        let char_indices: Vec<(usize, char)> = line.char_indices().collect();
        let start_byte = if pt.column < char_indices.len() {
            char_indices[pt.column].0
        } else {
            line.len()
        };

        let suffix = &line[start_byte..];
        let words: Vec<(usize, &str)> = suffix.split_word_bound_indices().collect();

        if words.len() > 1 {
            let next_byte = start_byte + words[1].0;
            let char_offset = line[..next_byte].chars().count();
            DocPoint::new(pt.line, char_offset)
        } else {
            DocPoint::new(pt.line, max_col)
        }
    }
}
