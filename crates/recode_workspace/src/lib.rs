// Copyright (c) 2026 Recode. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification, or redistribution is strictly prohibited.

//! Recode Core Clean-Room Workspace, Multi-Root File Tree, and Navigation Engine.
//!
//! Provides directory tree sorting, visible row projections, keyboard traversal,
//! git badge status tracking, and filename validation.

pub mod entry;
pub mod sorting;
pub mod tree;
pub mod workspace;

pub use entry::{EntryKind, FileEntry, GitStatus};
pub use sorting::{compare_file_entries, sort_entry_tree};
pub use tree::{FileTree, VisibleTreeRow};
pub use workspace::{validate_file_name, Workspace};

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_sorting_directories_before_files_case_insensitive() {
        let root_path = PathBuf::from("/project");
        let mut tree = FileTree::new("project", root_path.clone());

        // Add unsorted items
        tree.root_mut().children.push(FileEntry::new(
            "zebra.txt",
            root_path.join("zebra.txt"),
            PathBuf::from("zebra.txt"),
            EntryKind::File,
            1,
        ));
        tree.root_mut().children.push(FileEntry::new(
            "alpha.txt",
            root_path.join("alpha.txt"),
            PathBuf::from("alpha.txt"),
            EntryKind::File,
            1,
        ));
        tree.root_mut().children.push(FileEntry::new(
            "src",
            root_path.join("src"),
            PathBuf::from("src"),
            EntryKind::Directory,
            1,
        ));
        tree.root_mut().children.push(FileEntry::new(
            "build",
            root_path.join("build"),
            PathBuf::from("build"),
            EntryKind::Directory,
            1,
        ));

        tree.sort();

        let names: Vec<&str> = tree.root().children.iter().map(|c| c.name.as_str()).collect();
        // Directories "build", "src" must appear before files "alpha.txt", "zebra.txt"
        assert_eq!(names, vec!["build", "src", "alpha.txt", "zebra.txt"]);
    }

    #[test]
    fn test_visible_rows_expansion_projection() {
        let root_path = PathBuf::from("/project");
        let mut tree = FileTree::new("project", root_path.clone());

        let mut src_dir = FileEntry::new(
            "src",
            root_path.join("src"),
            PathBuf::from("src"),
            EntryKind::Directory,
            1,
        );
        src_dir.children.push(FileEntry::new(
            "main.rs",
            root_path.join("src/main.rs"),
            PathBuf::from("src/main.rs"),
            EntryKind::File,
            2,
        ));
        tree.root_mut().children.push(src_dir);

        // Initially "src" is collapsed -> visible rows count is 1 ("src" only)
        let rows = tree.visible_rows();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].name, "src");

        // Expand "src" -> visible rows count becomes 2 ("src", "main.rs")
        assert!(tree.toggle_expand(&root_path.join("src")));
        let expanded_rows = tree.visible_rows();
        assert_eq!(expanded_rows.len(), 2);
        assert_eq!(expanded_rows[1].name, "main.rs");
        assert_eq!(expanded_rows[1].depth, 2);
    }

    #[test]
    fn test_keyboard_navigation_traversal() {
        let root_path = PathBuf::from("/project");
        let mut tree = FileTree::new("project", root_path.clone());

        let mut dir = FileEntry::new(
            "src",
            root_path.join("src"),
            PathBuf::from("src"),
            EntryKind::Directory,
            1,
        );
        dir.children.push(FileEntry::new(
            "lib.rs",
            root_path.join("src/lib.rs"),
            PathBuf::from("src/lib.rs"),
            EntryKind::File,
            2,
        ));
        tree.root_mut().children.push(dir);
        tree.root_mut().children.push(FileEntry::new(
            "Cargo.toml",
            root_path.join("Cargo.toml"),
            PathBuf::from("Cargo.toml"),
            EntryKind::File,
            1,
        ));

        // Move down selects first item "src"
        tree.move_down();
        assert_eq!(tree.selected_path(), Some(root_path.join("src").as_path()));

        // Right arrow on collapsed folder expands it
        tree.handle_right_arrow();
        assert_eq!(tree.visible_rows().len(), 3); // src, lib.rs, Cargo.toml

        // Right arrow again moves into first child "lib.rs"
        tree.handle_right_arrow();
        assert_eq!(
            tree.selected_path(),
            Some(root_path.join("src/lib.rs").as_path())
        );

        // Left arrow moves back to parent "src"
        tree.handle_left_arrow();
        assert_eq!(tree.selected_path(), Some(root_path.join("src").as_path()));

        // Left arrow on expanded folder collapses it
        tree.handle_left_arrow();
        assert_eq!(tree.visible_rows().len(), 2); // src, Cargo.toml
    }

    #[test]
    fn test_file_name_validation() {
        assert!(validate_file_name("valid_name.rs").is_ok());
        assert!(validate_file_name("My Component-2.tsx").is_ok());

        // Invalid characters
        assert!(validate_file_name("bad:name.txt").is_err());
        assert!(validate_file_name("file*name.txt").is_err());
        assert!(validate_file_name("invalid/slash").is_err());

        // Reserved device names
        assert!(validate_file_name("con.txt").is_err());
        assert!(validate_file_name("nul").is_err());

        // Empty
        assert!(validate_file_name("").is_err());
        assert!(validate_file_name("   ").is_err());
    }
}
