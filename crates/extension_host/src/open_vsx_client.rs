use std::collections::BTreeSet;
use std::sync::Arc;

use anyhow::{Context as _, Result};
use chrono::{DateTime, Utc};
use cloud_api_types::{ExtensionApiManifest, ExtensionMetadata, ExtensionProvides};
use http_client::{AsyncBody, HttpClient};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct OpenVsxSearchResponse {
    pub extensions: Option<Vec<OpenVsxExtension>>,
    #[serde(rename = "totalSize")]
    pub total_size: Option<usize>,
}

#[derive(Debug, Deserialize)]
pub struct OpenVsxExtension {
    pub namespace: String,
    pub name: String,
    pub version: String,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "downloadCount")]
    pub download_count: Option<u64>,
    pub files: Option<OpenVsxFiles>,
    pub timestamp: Option<String>,
    pub url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct OpenVsxFiles {
    pub download: Option<String>,
    pub icon: Option<String>,
}

impl OpenVsxExtension {
    pub fn into_extension_metadata(self) -> ExtensionMetadata {
        let id: Arc<str> = Arc::from(format!("{}.{}", self.namespace, self.name));
        let display_name = self.display_name.unwrap_or_else(|| self.name.clone());
        let version: Arc<str> = Arc::from(self.version);
        let description = self.description;
        let authors = vec![self.namespace];
        let repository = self
            .files
            .as_ref()
            .and_then(|f| f.download.clone())
            .or_else(|| self.url.clone())
            .unwrap_or_default();

        let mut provides = BTreeSet::new();
        let desc_lower = format!(
            "{} {}",
            display_name.to_lowercase(),
            description.as_deref().unwrap_or("").to_lowercase()
        );

        if desc_lower.contains("theme") {
            provides.insert(ExtensionProvides::Themes);
        }
        if desc_lower.contains("icon") {
            provides.insert(ExtensionProvides::IconThemes);
        }
        if desc_lower.contains("debug") {
            provides.insert(ExtensionProvides::DebugAdapters);
        }
        if desc_lower.contains("format")
            || desc_lower.contains("lint")
            || desc_lower.contains("language")
            || desc_lower.contains("lsp")
            || desc_lower.contains("syntax")
            || desc_lower.contains("snippet")
        {
            provides.insert(ExtensionProvides::Languages);
            provides.insert(ExtensionProvides::LanguageServers);
        }

        let published_at = self
            .timestamp
            .and_then(|ts| DateTime::parse_from_rfc3339(&ts).ok())
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(Utc::now);

        ExtensionMetadata {
            id,
            manifest: ExtensionApiManifest {
                name: display_name,
                version,
                description,
                authors,
                repository,
                schema_version: Some(1),
                wasm_api_version: None,
                provides,
            },
            published_at,
            download_count: self.download_count.unwrap_or(0),
        }
    }
}

pub struct OpenVsxClient {
    http_client: Arc<dyn HttpClient>,
}

impl OpenVsxClient {
    pub fn new(http_client: Arc<dyn HttpClient>) -> Self {
        Self { http_client }
    }

    pub async fn search(&self, query: Option<&str>, size: usize) -> Result<Vec<ExtensionMetadata>> {
        let base_url = "https://open-vsx.org/api/-/search";
        let query_param = query.unwrap_or("");
        let url = format!("{base_url}?query={query_param}&size={size}");

        let mut response = self
            .http_client
            .get(&url, AsyncBody::empty(), true)
            .await
            .context("failed to query Open VSX API")?;

        if !response.status().is_success() {
            anyhow::bail!("Open VSX returned HTTP status {}", response.status());
        }

        let mut body = Vec::new();
        futures::AsyncReadExt::read_to_end(response.body_mut(), &mut body).await?;

        let search_resp: OpenVsxSearchResponse =
            serde_json::from_slice(&body).context("failed to parse Open VSX search response")?;

        let extensions = search_resp
            .extensions
            .unwrap_or_default()
            .into_iter()
            .map(OpenVsxExtension::into_extension_metadata)
            .collect();

        Ok(extensions)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_builtin_extensions_deserialize() {
        let extensions = crate::builtin_recode_extensions();
        assert!(!extensions.is_empty(), "Builtin extensions catalog must not be empty");
        assert!(extensions.iter().any(|e| e.id.as_ref() == "python"));
        assert!(extensions.iter().any(|e| e.id.as_ref() == "rust"));
        assert!(extensions.iter().any(|e| e.id.as_ref() == "godot"));
    }
}
