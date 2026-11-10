---
name: github
description: Advanced GitHub engineering and automation. Covers GitHub Actions CI/CD matrix builds, reusable composite actions, security scanning (CodeQL/Dependabot), branch protection rules, semantic release automation, and the GitHub CLI (gh).
---

# GitHub Automation & CI/CD Engineering

This skill provides exhaustive patterns for architecting automated GitHub Actions workflows, branch protection rulesets, release automation, and CLI operations.

---

## 1. High-Performance GitHub Actions Matrix CI/CD

Design resilient, multi-platform CI pipelines with caching and concurrency cancellation:

```yaml
# .github/workflows/ci.yml
name: Continuous Integration & Verification

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-test:
    name: Build & Test (${{ matrix.os }} - Node ${{ matrix.node }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [20, 22]
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js ${{ matrix.node }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Code Quality & Type Check
        run: npm run check

      - name: Execute Test Suite
        run: npm test -- --coverage

      - name: Upload Test Coverage Artifact
        if: matrix.os == 'ubuntu-latest' && matrix.node == 22
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

---

## 2. Reusable Composite Actions

Eliminate duplicated workflow code by creating modular composite actions:

```yaml
# .github/actions/setup-rust-env/action.yml
name: 'Setup Rust Toolchain & Cache'
description: 'Standardized rustup installation with sccache and cargo-binstall'
inputs:
  toolchain:
    description: 'Rust toolchain version'
    required: false
    default: 'stable'

runs:
  using: 'composite'
  steps:
    - name: Install Toolchain
      uses: dtolnay/rust-toolchain@master
      with:
        toolchain: ${{ inputs.toolchain }}
        components: rustfmt, clippy

    - name: Rust Cache Action
      uses: Swatinem/rust-cache@v2
      with:
        shared-key: "recode-build-cache"
```

---

## 3. Automated Semantic Releases & Artifact Publishing

Automate version bumping, changelog generation, and asset attachment:

```yaml
# .github/workflows/release.yml
name: Release Automation

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate Changelog
        id: changelog
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          draft: false
          prerelease: contains(github.ref, '-beta') || contains(github.ref, '-alpha')
```

---

## 4. GitHub CLI (`gh`) Automation Commands

- **PR Management**:
  ```bash
  gh pr create --title "feat: implement vector search" --body "Resolves #102" --reviewer team-core
  gh pr checks --watch
  gh pr merge --squash --auto --delete-branch
  ```
- **Secret & Variable Provisioning**:
  ```bash
  gh secret set PROD_DATABASE_URL --body "$DATABASE_URL" --env production
  gh variable set API_VERSION --body "v2.1"
  ```
- **Workflow Dispatch**:
  ```bash
  gh workflow run deploy.yml -f environment=staging -f dry_run=true
  ```

---

## 5. GitHub Engineering Checklist

- [ ] **Branch Protection Rulesets**: Enforce signed commits, linear history, minimum 1 approving review, and mandatory passing status checks before merge.
- [ ] **Least-Privilege Permissions**: Explicitly declare `permissions:` block at workflow or job level (avoid granting global write permissions).
- [ ] **Secret Hardening**: Never interpolate untrusted PR title/body directly into `run:` bash steps (prevents script injection attacks).
