//! Recode Core Clean-Room Language Server Protocol (LSP) Client and Diagnostics Engine.
//!
//! Provides JSON-RPC 2.0 Content-Length framing, document lifecycle tracking,
//! diagnostic severity indexing, and cursor coordinate lookups.

pub mod client;
pub mod diagnostics_store;
pub mod protocol;
pub mod types;

pub use client::{LanguageServerState, LspSession};
pub use diagnostics_store::DiagnosticsStore;
pub use protocol::{JsonRpcNotification, JsonRpcRequest, PacketDecoder};
pub use types::{
    CompletionCandidate, CompletionKind, DiagnosticSeverity, HoverDetails, LocationTarget,
    LspDiagnostic,
};

#[cfg(test)]
mod tests {
    use super::*;
    use recode_buffer::point::{DocPoint, DocSpan};
    use serde_json::json;

    #[test]
    fn test_jsonrpc_framing_and_streaming_decoder() {
        let req = JsonRpcRequest::new(1, "initialize", json!({}));
        let framed_bytes = req.to_framed_bytes();

        let mut decoder = PacketDecoder::new();

        // Feed half of the bytes
        let split_idx = framed_bytes.len() / 2;
        decoder.feed(&framed_bytes[..split_idx]);
        assert!(decoder.decode_next().is_none());

        // Feed remaining bytes
        decoder.feed(&framed_bytes[split_idx..]);
        let decoded = decoder.decode_next().expect("Should decode full packet");
        assert_eq!(decoded["id"], 1);
        assert_eq!(decoded["method"], "initialize");
    }

    #[test]
    fn test_diagnostics_severity_sorting_and_capping() {
        let mut store = DiagnosticsStore::new();
        let uri = "file:///src/main.rs";

        let d_warn = LspDiagnostic::new(
            DocSpan::new(DocPoint::new(1, 0), DocPoint::new(1, 10)),
            DiagnosticSeverity::Warning,
            "unused variable",
        );
        let d_err = LspDiagnostic::new(
            DocSpan::new(DocPoint::new(5, 4), DocPoint::new(5, 12)),
            DiagnosticSeverity::Error,
            "mismatched types",
        );

        // Insert in reverse order (Warning, Error)
        store.update_diagnostics(uri, vec![d_warn, d_err]);

        let items = store.get_for_uri(uri);
        assert_eq!(items.len(), 2);
        // Error must sort before Warning
        assert_eq!(items[0].severity, DiagnosticSeverity::Error);
        assert_eq!(items[1].severity, DiagnosticSeverity::Warning);

        // Status bar counters
        assert_eq!(store.total_error_count(), 1);
        assert_eq!(store.total_warning_count(), 1);
    }

    #[test]
    fn test_diagnostic_point_and_line_lookups() {
        let mut store = DiagnosticsStore::new();
        let uri = "file:///src/main.rs";

        let error_span = DocSpan::new(DocPoint::new(10, 4), DocPoint::new(10, 16));
        let diag = LspDiagnostic::new(error_span, DiagnosticSeverity::Error, "cannot borrow as mutable");
        store.update_diagnostics(uri, vec![diag]);

        // Point inside the error span
        let hits = store.get_at_point(uri, DocPoint::new(10, 8));
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].message, "cannot borrow as mutable");

        // Point outside the error span
        let misses = store.get_at_point(uri, DocPoint::new(10, 20));
        assert!(misses.is_empty());

        // Line query for gutter
        let line_hits = store.get_for_line(uri, 10);
        assert_eq!(line_hits.len(), 1);
    }

    #[test]
    fn test_lsp_session_document_lifecycle_versioning() {
        let mut session = LspSession::new("rust-analyzer");
        let uri = "file:///src/lib.rs";

        let open_notif = session.make_did_open(uri, "rust", "fn test() {}");
        assert_eq!(open_notif.params["textDocument"]["version"], 1);

        let change_1 = session.make_did_change(uri, "fn test() { let x = 1; }");
        assert_eq!(change_1.params["textDocument"]["version"], 2);

        let change_2 = session.make_did_change(uri, "fn test() { let x = 2; }");
        assert_eq!(change_2.params["textDocument"]["version"], 3);

        let close_notif = session.make_did_close(uri);
        assert_eq!(close_notif.params["textDocument"]["uri"], uri);
    }
}
