# Recode Operational Runbook

## 1. Local Development & Building Recode

### Prerequisites
- Rust stable (1.85+) via `rustup`
- Git
- Platform C++ build tools (Visual Studio 2022 on Windows, Xcode CLI on macOS, build-essential on Linux)

### Building the Desktop Editor
```bash
# Clone the repository
git clone https://github.com/Fortunehack45/Recode.git
cd Recode

# Compile debug build
cargo build --package recode

# Compile optimized release build
cargo build --release --package recode --package cli

# Run the compiled binary
./target/release/recode
```

---

## 2. Collaboration Server Operations (`crates/collab`)

### Running Locally
1. Ensure a PostgreSQL instance is running locally or specify a remote Supabase connection string.
2. Configure `.env.toml` in `crates/collab/`:
   ```toml
   DATABASE_URL = "postgres://postgres:password@localhost:5432/recode_collab"
   DATABASE_MAX_CONNECTIONS = 5
   HTTP_PORT = 8080
   RECODE_ENVIRONMENT = "development"
   RECODE_CLOUD_INTERNAL_API_KEY = "local-secret"
   ```
3. Run the collab server:
   ```bash
   cargo run --package collab --bin collab -- serve all
   ```
4. Verify health status:
   ```bash
   curl http://localhost:8080/healthz
   # Expected output: ok
   ```

### Deploying to Fly.io
1. Install Flyctl (`https://fly.io/docs/hands-on/install-flyctl/`).
2. Log in to Fly.io:
   ```bash
   fly auth login
   ```
3. Set secrets for the application:
   ```bash
   fly secrets set \
     DATABASE_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
     LIVEKIT_SERVER="wss://recode-....livekit.cloud" \
     LIVEKIT_KEY="API_KEY_HERE" \
     LIVEKIT_SECRET="API_SECRET_HERE" \
     RECODE_CLOUD_INTERNAL_API_KEY="recode-internal-secret"
   ```
4. Deploy using `fly.toml`:
   ```bash
   fly deploy -c fly.toml
   ```
5. Check deployment status and live logs:
   ```bash
   fly status -c fly.toml
   fly logs -c fly.toml
   ```

---

## 3. GitHub Actions Release Automation

To publish a new official cross-platform release:
1. Ensure all changes are merged into `main`.
2. Create and push a semver tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. The GitHub Actions release workflow automatically:
   - Builds Windows x64 (`RecodeSetup-x64.exe` installer and portable `.zip`).
   - Builds macOS ARM64 (`Recode-macos-arm64.zip`).
   - Builds Linux x64 (`Recode-linux-x64.tar.gz`).
   - Generates SHA-256 checksums and `latest.json` auto-update manifest.
   - Publishes the GitHub Release.

---

## 4. Troubleshooting Common Issues

### Issue A: Windows Taskbar Clipping when Maximized
- **Resolution**: Ensured `crates/gpui_windows/src/events.rs` checks `WS_MAXIMIZE` and clamps window rect to `rcWork`.

### Issue B: Extension Marketplace Fails to Load (Offline or 404)
- **Cause**: Upstream network outage or custom registry configuration.
- **Resolution**: Check `RECODE_EXTENSIONS_URL` environment variable. By default, it queries the Eclipse Open VSX registry (`https://open-vsx.org/api`) with built-in catalog fallback.

### Issue C: GitHub Device Sign-In Token Not Recognized
- **Resolution**: Verify that the GitHub user code was entered and confirmed at `https://github.com/login/device`. The desktop client polls automatically every 5 seconds until confirmed.
