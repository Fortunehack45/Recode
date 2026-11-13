use std::path::Path;
use std::sync::Arc;

use anyhow::{Context as _, Result};
use http_client::{AsyncBody, HttpClient};
use serde_json::Value;

pub struct VsixInstaller;

impl VsixInstaller {
    /// Downloads a .vsix package from `download_url` and extracts its contents safely into `target_dir`.
    pub async fn install_vsix(
        download_url: &str,
        target_dir: &Path,
        http_client: Arc<dyn HttpClient>,
    ) -> Result<()> {
        log::info!("downloading VSIX from {download_url} to {}", target_dir.display());

        let mut response = http_client
            .get(download_url, AsyncBody::empty(), true)
            .await
            .context("failed to request VSIX package")?;

        if !response.status().is_success() {
            anyhow::bail!("VSIX download failed with HTTP status {}", response.status());
        }

        // Create target directory if it doesn't exist
        smol::fs::create_dir_all(target_dir)
            .await
            .context("failed to create extension target directory")?;

        // Extract zip archive safely (util::archive::extract_zip contains path traversal protection)
        util::archive::extract_zip(target_dir, response.body_mut())
            .await
            .context("failed to extract VSIX archive")?;

        // Inspect extension/package.json if present to generate extension.toml metadata
        let pkg_json_path = target_dir.join("extension").join("package.json");
        if pkg_json_path.exists() {
            if let Ok(pkg_bytes) = smol::fs::read(&pkg_json_path).await {
                if let Ok(pkg) = serde_json::from_slice::<Value>(&pkg_bytes) {
                    Self::generate_extension_toml(target_dir, &pkg).await?;
                }
            }
        }

        log::info!("successfully installed VSIX extension into {}", target_dir.display());
        Ok(())
    }

    /// Generates a compatible extension.toml from package.json contributions
    async fn generate_extension_toml(target_dir: &Path, pkg: &Value) -> Result<()> {
        let name = pkg["name"].as_str().unwrap_or("extension");
        let publisher = pkg["publisher"].as_str().unwrap_or("publisher");
        let id = format!("{publisher}.{name}");
        let version = pkg["version"].as_str().unwrap_or("1.0.0");
        let display_name = pkg["displayName"].as_str().unwrap_or(name);
        let description = pkg["description"].as_str().unwrap_or("");

        let mut toml = format!(
            "id = {:?}\nname = {:?}\nversion = {:?}\nschema_version = 1\n",
            id, display_name, version
        );

        if !description.is_empty() {
            toml.push_str(&format!("description = {:?}\n", description));
        }

        toml.push_str(&format!("authors = [{:?}]\n", publisher));

        let manifest_path = target_dir.join("extension.toml");
        smol::fs::write(&manifest_path, toml.as_bytes())
            .await
            .context("failed to write extension.toml for VSIX")?;

        Ok(())
    }
}
