//! Semantic types for LSP diagnostics, completions, hover info, and symbols.

use recode_buffer::point::{DocPoint, DocSpan};
use serde::{Deserialize, Serialize};

/// Diagnostic severity levels conforming to LSP spec.
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
pub enum DiagnosticSeverity {
    Error = 1,
    Warning = 2,
    Information = 3,
    Hint = 4,
}

impl DiagnosticSeverity {
    /// Badge label for status indicators.
    pub const fn label(&self) -> &'static str {
        match self {
            Self::Error => "Error",
            Self::Warning => "Warning",
            Self::Information => "Info",
            Self::Hint => "Hint",
        }
    }
}

/// An individual diagnostic issue published by a language server.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct LspDiagnostic {
    pub range: DocSpan,
    pub severity: DiagnosticSeverity,
    pub code: Option<String>,
    pub source: Option<String>,
    pub message: String,
}

impl LspDiagnostic {
    pub fn new(range: DocSpan, severity: DiagnosticSeverity, message: impl Into<String>) -> Self {
        Self {
            range,
            severity,
            code: None,
            source: None,
            message: message.into(),
        }
    }

    /// Whether this diagnostic is an error.
    pub fn is_error(&self) -> bool {
        matches!(self.severity, DiagnosticSeverity::Error)
    }

    /// Whether this diagnostic is a warning.
    pub fn is_warning(&self) -> bool {
        matches!(self.severity, DiagnosticSeverity::Warning)
    }

    /// Checks if a given document point falls within this diagnostic's span.
    pub fn contains_point(&self, point: DocPoint) -> bool {
        self.range.contains_point(point)
    }
}

/// Category of an autocomplete completion suggestion.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize)]
pub enum CompletionKind {
    Keyword,
    Function,
    Variable,
    Struct,
    Interface,
    Module,
    Snippet,
    Property,
    Field,
    Value,
}

impl CompletionKind {
    /// String identifier for kind icons.
    pub const fn icon_symbol(&self) -> &'static str {
        match self {
            Self::Keyword => "kw",
            Self::Function => "fn",
            Self::Variable => "var",
            Self::Struct => "struct",
            Self::Interface => "trait",
            Self::Module => "mod",
            Self::Snippet => "snip",
            Self::Property => "prop",
            Self::Field => "fld",
            Self::Value => "val",
        }
    }
}

/// A candidate suggestion in the code completion popup menu.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct CompletionCandidate {
    pub label: String,
    pub kind: CompletionKind,
    pub detail: Option<String>,
    pub documentation: Option<String>,
    pub insert_text: String,
}

impl CompletionCandidate {
    pub fn new(label: impl Into<String>, kind: CompletionKind) -> Self {
        let l = label.into();
        Self {
            insert_text: l.clone(),
            label: l,
            kind,
            detail: None,
            documentation: None,
        }
    }
}

/// Markdown hover tooltip documentation.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct HoverDetails {
    pub markdown: String,
    pub target_range: Option<DocSpan>,
}

/// Navigation target for Go to Definition and Find References.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct LocationTarget {
    pub uri: String,
    pub range: DocSpan,
}
