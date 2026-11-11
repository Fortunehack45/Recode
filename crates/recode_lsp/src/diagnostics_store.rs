//! Diagnostics aggregation, severity indexing, and cursor coordinate lookups.

use crate::types::{DiagnosticSeverity, LspDiagnostic};
use recode_buffer::point::DocPoint;
use std::collections::HashMap;

/// An aggregated repository of all active compiler and linter diagnostics across the workspace.
#[derive(Clone, PartialEq, Eq, Debug, Default)]
pub struct DiagnosticsStore {
    diagnostics_by_uri: HashMap<String, Vec<LspDiagnostic>>,
}

impl DiagnosticsStore {
    pub fn new() -> Self {
        Self {
            diagnostics_by_uri: HashMap::new(),
        }
    }

    /// Replaces diagnostics for a specific file URI (conforming to publishDiagnostics).
    /// Enforces the spec invariant: caps at 5,000 items sorted by severity.
    pub fn update_diagnostics(&mut self, uri: impl Into<String>, mut items: Vec<LspDiagnostic>) {
        // Sort by severity (Errors first, then Warnings, Info, Hints)
        items.sort_by_key(|d| d.severity);
        // Cap to preserve 60FPS rendering performance
        items.truncate(5_000);

        self.diagnostics_by_uri.insert(uri.into(), items);
    }

    /// Clears diagnostics for a file URI.
    pub fn clear_uri(&mut self, uri: &str) {
        self.diagnostics_by_uri.remove(uri);
    }

    /// Retrieves all diagnostics for a file URI.
    pub fn get_for_uri(&self, uri: &str) -> &[LspDiagnostic] {
        self.diagnostics_by_uri
            .get(uri)
            .map_or(&[], |vec| vec.as_slice())
    }

    /// Finds all diagnostics touching a specific document coordinate (for hover tooltips).
    pub fn get_at_point(&self, uri: &str, point: DocPoint) -> Vec<LspDiagnostic> {
        let items = self.get_for_uri(uri);
        items
            .iter()
            .filter(|d| d.contains_point(point))
            .cloned()
            .collect()
    }

    /// Finds all diagnostics on a specific 0-based line (for gutter badges and ghost text).
    pub fn get_for_line(&self, uri: &str, line: usize) -> Vec<LspDiagnostic> {
        let items = self.get_for_uri(uri);
        items
            .iter()
            .filter(|d| d.range.start.line <= line && line <= d.range.end.line)
            .cloned()
            .collect()
    }

    /// Total count of errors across all open files in the workspace (for status bar).
    pub fn total_error_count(&self) -> usize {
        self.diagnostics_by_uri
            .values()
            .flat_map(|list| list.iter())
            .filter(|d| d.is_error())
            .count()
    }

    /// Total count of warnings across all open files in the workspace (for status bar).
    pub fn total_warning_count(&self) -> usize {
        self.diagnostics_by_uri
            .values()
            .flat_map(|list| list.iter())
            .filter(|d| d.is_warning())
            .count()
    }
}
