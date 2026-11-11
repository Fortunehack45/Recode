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

## Contributor License Agreement & Terms

By submitting a Pull Request, issue patch, or contribution to Recode, you agree to the [Recode Contributor License Agreement (CLA)](legal/CONTRIBUTOR_LICENSE_AGREEMENT.md) and acknowledge that:
1. Recode is governed by the [Recode Source-Available & Anti-Forking License](LICENSE.md).
2. The source code is made publicly available for personal use, inspection, and upstream contributions; creating downstream forks, rebranding the software, or publishing competing distributions is strictly prohibited under our [Trademark Policy](legal/TRADEMARK_POLICY.md).

## Building from Source

```bash
cargo build --release --package recode
```
