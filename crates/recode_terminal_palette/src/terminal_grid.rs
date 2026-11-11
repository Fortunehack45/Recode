//! Terminal character grid, scrollback buffer, and dynamic dimension calculation.

use serde::{Deserialize, Serialize};

/// Text styling flags for a terminal cell.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default, Serialize, Deserialize)]
pub struct CellAttributes {
    pub is_bold: bool,
    pub is_dim: bool,
    pub is_italic: bool,
    pub is_underline: bool,
    pub is_inverse: bool,
}

/// An individual character cell on the terminal screen.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct TerminalCell {
    pub character: char,
    pub attributes: CellAttributes,
}

impl Default for TerminalCell {
    fn default() -> Self {
        Self {
            character: ' ',
            attributes: CellAttributes::default(),
        }
    }
}

/// Dynamic 2D terminal character grid with scrollback retention.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct TerminalGrid {
    pub cols: usize,
    pub rows: usize,
    pub cursor_col: usize,
    pub cursor_row: usize,
    lines: Vec<Vec<TerminalCell>>,
    max_scrollback: usize,
}

impl TerminalGrid {
    /// Constructs a grid with fixed initial dimensions and default 10,000 scrollback limit.
    pub fn new(cols: usize, rows: usize) -> Self {
        let cols = cols.max(1);
        let rows = rows.max(1);
        let mut lines = Vec::with_capacity(rows);
        for _ in 0..rows {
            lines.push(vec![TerminalCell::default(); cols]);
        }

        Self {
            cols,
            rows,
            cursor_col: 0,
            cursor_row: 0,
            lines,
            max_scrollback: 10_000,
        }
    }

    /// Computes terminal columns and rows from available pixel geometry and font metrics.
    /// Conforms to `spec/terminal_palette.md`:
    /// Columns = (width - 16) / char_width, Rows = (height - 28) / line_height
    pub fn compute_dimensions(
        viewport_width: f32,
        viewport_height: f32,
        char_width: f32,
        line_height: f32,
    ) -> (usize, usize) {
        if char_width <= 0.0 || line_height <= 0.0 {
            return (80, 24);
        }

        let avail_w = (viewport_width - 16.0).max(0.0);
        let avail_h = (viewport_height - 28.0).max(0.0);

        let cols = (avail_w / char_width).floor() as usize;
        let rows = (avail_h / line_height).floor() as usize;

        (cols.max(10), rows.max(2))
    }

    /// Total lines in the grid including scrollback history.
    pub fn total_lines(&self) -> usize {
        self.lines.len()
    }

    /// Resizes the visible grid dimensions.
    pub fn resize(&mut self, new_cols: usize, new_rows: usize) {
        let new_cols = new_cols.max(1);
        let new_rows = new_rows.max(1);

        for line in &mut self.lines {
            line.resize(new_cols, TerminalCell::default());
        }

        while self.lines.len() < new_rows {
            self.lines.push(vec![TerminalCell::default(); new_cols]);
        }

        self.cols = new_cols;
        self.rows = new_rows;
        self.cursor_col = self.cursor_col.min(self.cols.saturating_sub(1));
        self.cursor_row = self.cursor_row.min(self.rows.saturating_sub(1));
    }

    /// Writes a character at the current cursor position, advancing column.
    pub fn write_char(&mut self, ch: char) {
        match ch {
            '\r' => {
                self.cursor_col = 0;
            }
            '\n' => {
                self.newline();
            }
            '\t' => {
                // Tab advances to next multiple of 8
                let next_tab = ((self.cursor_col / 8) + 1) * 8;
                self.cursor_col = next_tab.min(self.cols.saturating_sub(1));
            }
            _ => {
                let target_line = self.lines.len().saturating_sub(self.rows) + self.cursor_row;
                if target_line < self.lines.len() && self.cursor_col < self.cols {
                    self.lines[target_line][self.cursor_col] = TerminalCell {
                        character: ch,
                        attributes: CellAttributes::default(),
                    };
                }

                self.cursor_col += 1;
                if self.cursor_col >= self.cols {
                    self.cursor_col = 0;
                    self.newline();
                }
            }
        }
    }

    /// Writes a string to the terminal.
    pub fn write_str(&mut self, text: &str) {
        for ch in text.chars() {
            self.write_char(ch);
        }
    }

    fn newline(&mut self) {
        if self.cursor_row + 1 < self.rows {
            self.cursor_row += 1;
        } else {
            // Scroll down: add new line at bottom
            self.lines.push(vec![TerminalCell::default(); self.cols]);
            if self.lines.len() > self.max_scrollback {
                self.lines.remove(0);
            }
        }
    }

    /// Returns a plain text slice of a specific line index.
    pub fn line_to_string(&self, line_idx: usize) -> String {
        if let Some(line) = self.lines.get(line_idx) {
            line.iter().map(|c| c.character).collect()
        } else {
            String::new()
        }
    }
}

/// An interactive terminal tab instance.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct TerminalTabSession {
    pub id: u64,
    pub title: String,
    pub pty_pid: Option<u32>,
    pub grid: TerminalGrid,
}

impl TerminalTabSession {
    pub fn new(id: u64, title: impl Into<String>, cols: usize, rows: usize) -> Self {
        Self {
            id,
            title: title.into(),
            pty_pid: None,
            grid: TerminalGrid::new(cols, rows),
        }
    }
}
