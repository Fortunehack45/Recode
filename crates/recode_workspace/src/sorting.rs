//! Sorting invariants: directories first, case-insensitive natural alphabetical ordering.

use crate::entry::{EntryKind, FileEntry};
use std::cmp::Ordering;

/// Compares two file entries enforcing the spec invariants.
pub fn compare_file_entries(a: &FileEntry, b: &FileEntry) -> Ordering {
    // 1. Directories sort before files
    match (a.kind, b.kind) {
        (EntryKind::Directory, EntryKind::File | EntryKind::Symlink) => return Ordering::Less,
        (EntryKind::File | EntryKind::Symlink, EntryKind::Directory) => return Ordering::Greater,
        _ => {}
    }

    // 2. Case-insensitive alphabetical sorting
    let a_lower = a.name.to_lowercase();
    let b_lower = b.name.to_lowercase();

    match a_lower.cmp(&b_lower) {
        Ordering::Equal => a.name.cmp(&b.name),
        ord => ord,
    }
}

/// Recursively sorts all children in an entry tree.
pub fn sort_entry_tree(entry: &mut FileEntry) {
    if !entry.children.is_empty() {
        entry.children.sort_by(compare_file_entries);
        for child in &mut entry.children {
            sort_entry_tree(child);
        }
    }
}
