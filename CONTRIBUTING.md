# Contributing to Recode

Thank you for helping us make Recode better!

## Before you start

- **Keep no more than three PRs open at a time.**
  This limit helps us keep up with reviews and ensures all contributors get a fair share of our reviewing capacity.
- **Discuss features before you start writing code for them**.
  If there isn't a GitHub issue with confirmation that we want it, start a GitHub discussion or issue first.
  - Before proposing a larger feature, review the existing architecture and design decisions.

All activity in Recode forums is subject to our Code of Conduct.

### Things we will (probably) not merge

- **Features whose complexity outweighs their benefit.**
- **Giant refactorings without prior alignment.**
- **Non-trivial changes without tests.**
- **LLM-generated code the author does not understand.**

### We love PRs that...

- **Fix or extend the docs**
- **Fix bugs and improve stability**
- **Improve performance and reduce memory allocations**
- **Add small quality-of-life features or shortcuts**

## Building from Source

```bash
cargo build --release --package recode
```
