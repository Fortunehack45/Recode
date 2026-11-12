# Recode Extensions

This directory contains extensions for Recode that are largely maintained by the Recode team. They currently live in the Recode repository for ease of maintenance.

If you are looking for the Recode extension registry, see the [`zed-industries/extensions`](https://github.com/zed-industries/extensions) repo.

## Structure

Currently, Recode includes support for a number of languages without requiring installing an extension. Their grammars, queries, and configs can be found under [`crates/grammars/src`](https://github.com/Fortunehack45/Recode/tree/main/crates/grammars/src), and their language server adapters under [`crates/languages/src`](https://github.com/Fortunehack45/Recode/tree/main/crates/languages/src).

Support for all other languages is done via extensions. This directory ([extensions/](https://github.com/Fortunehack45/Recode/tree/main/extensions/)) contains some of the officially maintained extensions. These extensions use the same [zed_extension_api](https://docs.rs/zed_extension_api/latest/zed_extension_api/) available to all [Recode Extensions](https://recode.dev/extensions) for providing [language servers](https://recode.dev/docs/extensions/languages#language-servers), [tree-sitter grammars](https://recode.dev/docs/extensions/languages#grammar) and [tree-sitter queries](https://recode.dev/docs/extensions/languages#tree-sitter-queries).

You can find the other officially maintained extensions in the [recode-extensions organization](https://github.com/recode-extensions).

## Dev Extensions

See the docs for [Developing an Extension Locally](https://recode.dev/docs/extensions/developing-extensions#developing-an-extension-locally) for how to work with one of these extensions.
