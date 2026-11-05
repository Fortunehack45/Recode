# Contributing to Recode
### Welcome! 👋
This is the official guide on how to contribute to Recode. We want to make it as easy as possible to contribute, so if you have any questions or feedback, feel free to open an issue or discussion on GitHub!

There are a few ways to contribute:

- 💫 Implement feature requests and bug fixes.
- 💡 Submit suggestions and discuss architecture.
- 🪴 Open Issues and Pull Requests in this repository.

---

### Codebase Guide

Most Recode AI code lives in the folder `src/vs/workbench/contrib/cortexide/`.

- React UI: `src/vs/workbench/contrib/cortexide/browser/react/`
- Workbench Integration: `src/vs/workbench/contrib/cortexide/browser/`
- AI Services & LLMs: `src/vs/workbench/contrib/cortexide/common/`

---

## Editing Recode Code

If you're making changes to Recode as a contributor, you'll want to run a local version to test your changes. Developer mode lets you do this.

### a. Mac - Prerequisites

If you're using a Mac, you need Python and Xcode Command Line Tools (`xcode-select --install`).

### b. Windows - Prerequisites

If you're using a Windows computer, install [Visual Studio 2022](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community).

In Visual Studio Installer, select:
- `Desktop development with C++`
- `Node.js build tools`

Under "Individual Components", ensure the MSVC v143 toolchain is selected, then install.

### c. Linux - Prerequisites

First, run `npm install -g node-gyp`. Then:

- Debian / Ubuntu: `sudo apt-get install -y build-essential g++ libx11-dev libxkbfile-dev libsecret-1-dev libkrb5-dev python-is-python3`
- Red Hat / Fedora: `sudo dnf install -y @development-tools gcc gcc-c++ make libsecret-devel krb5-devel libX11-devel libxkbfile-devel`
- SUSE / openSUSE: `sudo zypper install -y patterns-devel-C-C++-devel_C_C++ krb5-devel libsecret-devel libxkbfile-devel libX11-devel`

---

### Developer Mode Instructions

1. Clone this repository:
   ```bash
   git clone https://github.com/Fortunehack45/Recode.git
   cd Recode
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Build the React AI workbench:
   ```bash
   npm run buildreact
   ```
4. Start compilation:
   - Windows: Press <kbd>Ctrl+Shift+B</kbd> or run `npm run watch`
   - macOS: Press <kbd>Cmd+Shift+B</kbd> or run `npm run watch`
   - Linux: Press <kbd>Ctrl+Shift+B</kbd> or run `npm run watch`
5. Launch the Recode window:
   - Windows: `./scripts/code.bat`
   - macOS / Linux: `./scripts/code.sh`
6. You're ready to edit Recode!
   - Press <kbd>Ctrl+R</kbd> (<kbd>Cmd+R</kbd>) inside the developer window to reload after changes.

---

#### Common Fixes

- Ensure your Node.js version is `22.22.1` (matching `.nvmrc`).
- If you touch React files under `browser/react/`, run `npm run buildreact` to rebuild the bundle.
- Ensure the path to your Recode repository contains no spaces.

---

### Building Binaries Locally

To build a standalone production executable of Recode:

```bash
# Windows x64
npm run gulp vscode-win32-x64-min

# Linux x64
npm run gulp vscode-linux-x64-min

# macOS (Apple Silicon Arm64)
npm run gulp vscode-darwin-arm64-min
```

The output will be created in `../VSCode-<platform>-<arch>/` with the executable named `Recode.exe` (Windows), `recode` (Linux), or `Recode.app` (macOS).

---

## Pull Request Guidelines

- Submit a pull request once you have tested your change.
- Keep commits clear, descriptive, and focused.
- Ensure your changes follow existing TypeScript code conventions.
