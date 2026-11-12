---
title: Diff
description: "Configure Diff language support in Recode, including language servers, formatting, and debugging."
---

# Diff

Diff support is available natively in Recode.

- Tree-sitter: [zed-industries/the-mikedavis/tree-sitter-diff](https://github.com/the-mikedavis/tree-sitter-diff)

## Configuration

Recode will not attempt to format diff files and has [`remove_trailing_whitespace_on_save`](https://recode.dev/docs/reference/all-settings#remove-trailing-whitespace-on-save) and [`ensure-final-newline-on-save`](https://recode.dev/docs/reference/all-settings#ensure-final-newline-on-save) set to false.

Recode will automatically recognize files with `patch` and `diff` extensions as Diff files. To recognize other extensions, add them to `file_types` in your Recode settings.json:

```json [settings]
  "file_types": {
    "Diff": ["dif"]
  },
```
