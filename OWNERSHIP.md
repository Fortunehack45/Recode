# Recode Release, Packaging & Code Signing Ownership Specification

This document details the code signing, notarization, packaging credentials, and operational requirements needed by the organization to produce trusted, verified releases of **Recode** across macOS, Windows, and Linux.

---

## 1. Security & Hygiene Principles

> [!CAUTION]
> **Zero Secrets in Repository**: Never commit code-signing certificates (`.p12`, `.pfx`, `.cer`, `.key`), provisioning profiles, private API tokens, or release passwords to the git repository. All signing credentials must be stored strictly in enterprise secret managers (e.g. GitHub Actions Encrypted Secrets, AWS Secrets Manager, or 1Password Connect) and injected into ephemeral CI runners at build time.

---

## 2. macOS Code Signing & Notarization

To distribute Recode on macOS without Gatekeeper security warnings ("App is damaged" or "Cannot be opened because developer cannot be verified"):

### Required Assets
1. **Apple Developer Program Organization Account**:
   - Organization Team ID (10-character alphanumeric string, e.g. `ABC1234XYZ`).
   - Bundle Identifier: `dev.recode.editor` (Stable), `dev.recode.editor.preview` (Preview), `dev.recode.editor.nightly` (Nightly), `dev.recode.editor.dev` (Dev).
2. **Developer ID Application Certificate**:
   - Exported as encrypted `.p12` file (Base64-encoded for CI storage).
   - Certificate password.
3. **Apple Notary Service API Credentials**:
   - **App Store Connect API Key** (`.p8` file):
     - Key ID (`APPLE_API_KEY_ID`).
     - Issuer ID (`APPLE_API_ISSUER_ID`).
   - *Or* App-specific password (`APPLE_ID` and `APPLE_APP_SPECIFIC_PASSWORD`).

### CI Signing Workflow
- **Codesign**:
  ```bash
  codesign --deep --force --options runtime --entitlements resources/macos/recode.entitlements --sign "Developer ID Application: <Your Company Name> (<TEAM_ID>)" "Recode.app"
  ```
- **Notarization**:
  ```bash
  xcrun notarytool submit "Recode.dmg" --key "<path-to-p8>" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER_ID" --wait
  xcrun stapler staple "Recode.dmg"
  ```

---

## 3. Windows Code Signing & Packaging

To eliminate Windows Defender SmartScreen warnings ("Windows protected your PC") on Windows:

### Required Assets
1. **Windows Authenticode Code Signing Certificate**:
   - **Option A (Recommended - Modern Cloud HSM)**: **Azure Trusted Signing** (formerly Microsoft Artifact Signing). Requires no physical hardware tokens and integrates directly with GitHub Actions.
   - **Option B (Traditional EV Certificate)**: Hardware Token (YubiKey/SafeNet) or Cloud HSM (Azure Key Vault, AWS CloudHSM, DigiCert ONE) with an Extended Validation (EV) Code Signing Certificate.
2. **Timestamp Authority (RFC 3161)**:
   - Uses an official timestamp server (e.g., `http://timestamp.digicert.com` or `http://timestamp.sectigo.com`) to ensure signatures remain valid after certificate expiry.

### CI Signing Commands
```powershell
# Signing NSIS Installer and Portable Executables
signtool.exe sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /f "$env:CERT_PATH" /p "$env:CERT_PASSWORD" "target\release\recode.exe"
signtool.exe sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /f "$env:CERT_PATH" /p "$env:CERT_PASSWORD" "target\release\RecodeSetup-x64.exe"
```

---

## 4. Linux Packaging & Distribution

### Required Assets
1. **GPG Release Key**:
   - Dedicated 4096-bit RSA or Ed25519 GPG key for signing `.deb`, `.rpm`, and Arch Linux packages (`.pkg.tar.zst`).
   - Public key hosted at `https://recode.dev/keys/recode-signing-key.asc` or GitHub Releases.
2. **Package Formats**:
   - `.tar.gz`: Portable standalone Linux x64 and ARM64 archive.
   - `.deb` & `.rpm`: Native system packages with desktop launcher entry (`resources/linux/recode.desktop`) and mime associations.
   - `AppImage`: Portable single-binary Linux executable signed with `appimagetool`.
   - `Flatpak`: Published to Flathub using the application ID `dev.recode.editor`.
   - `Snap`: Snapcraft store publishing token (`SNAPCRAFT_STORE_CREDENTIALS`).

---

## 5. Required GitHub Secrets Checklist

When configuring GitHub Actions for production automated releases:

| Secret Name | Purpose | Platform |
|---|---|---|
| `MACOS_CERTIFICATE_P12_BASE64` | Encrypted Developer ID Application certificate | macOS |
| `MACOS_CERTIFICATE_PASSWORD` | Password for the `.p12` certificate | macOS |
| `APPLE_API_KEY_ID` | App Store Connect Notarization Key ID | macOS |
| `APPLE_API_ISSUER_ID` | App Store Connect Issuer UUID | macOS |
| `APPLE_API_KEY_P8_BASE64` | Private `.p8` API key for `notarytool` | macOS |
| `WINDOWS_CERT_BASE64` | PFX/P12 Authenticode signing certificate | Windows |
| `WINDOWS_CERT_PASSWORD` | Password for the Windows code-signing PFX | Windows |
| `GPG_PRIVATE_KEY` | Linux package signing private key | Linux |
| `GPG_PASSPHRASE` | Passphrase for the GPG private key | Linux |
| `RECODE_GITHUB_CLIENT_ID` | Production GitHub OAuth App Client ID (Device Flow) | Universal |
| `RECODE_GITHUB_CLIENT_SECRET` | Production GitHub OAuth App Secret (Collab Backend only) | Server |
| `LIVEKIT_API_KEY` | LiveKit Server API Key (WebRTC audio/screen calls) | Server |
| `LIVEKIT_API_SECRET` | LiveKit Server API Secret | Server |
| `FLY_API_TOKEN` | Fly.io deployment token for `crates/collab` backend | Server |
