use crate::jobs::{JobInfo, JobStore};
use crate::protocol::{ReadResourceResult, ResourceContent, ResourceDefinition};
use crate::resolution::BinaryResolver;
use crate::tools::ToolManager;
use serde_json::json;
use std::fs;

#[derive(Clone)]
pub struct ResourceManager {
    job_store: JobStore,
    tool_manager: ToolManager,
    resolver: BinaryResolver,
}

impl ResourceManager {
    pub fn new(job_store: JobStore, tool_manager: ToolManager, resolver: BinaryResolver) -> Self {
        Self {
            job_store,
            tool_manager,
            resolver,
        }
    }

    pub fn list_resources(&self) -> Vec<ResourceDefinition> {
        vec![
            ResourceDefinition {
                uri: "ytdeck://queue".to_string(),
                name: "Download Queue".to_string(),
                description: "All current and pending download jobs".to_string(),
                mime_type: "application/json".to_string(),
            },
            ResourceDefinition {
                uri: "ytdeck://history".to_string(),
                name: "Download History".to_string(),
                description: "Completed download history (last 500 entries)".to_string(),
                mime_type: "application/json".to_string(),
            },
            ResourceDefinition {
                uri: "ytdeck://settings".to_string(),
                name: "App Settings".to_string(),
                description: "Current ytdeck-mcp settings".to_string(),
                mime_type: "application/json".to_string(),
            },
            ResourceDefinition {
                uri: "ytdeck://supported-sites".to_string(),
                name: "Supported Sites".to_string(),
                description: "All 1750+ supported extractors".to_string(),
                mime_type: "application/json".to_string(),
            },
        ]
    }

    pub async fn read_resource(&self, uri: &str) -> Result<ReadResourceResult, String> {
        match uri {
            "ytdeck://queue" => {
                let active_jobs = self.job_store.list_jobs(Some("active")).await;
                let text = serde_json::to_string_pretty(&active_jobs)
                    .map_err(|e| format!("Serialization error: {}", e))?;
                Ok(ReadResourceResult {
                    contents: vec![ResourceContent {
                        uri: uri.to_string(),
                        mime_type: "application/json".to_string(),
                        text,
                    }],
                })
            }
            "ytdeck://history" => {
                let history_path = JobStore::get_app_data_history_path();
                let entries: Vec<JobInfo> = if let Some(path) = history_path {
                    if path.exists() {
                        fs::read_to_string(path)
                            .ok()
                            .and_then(|s| serde_json::from_str(&s).ok())
                            .unwrap_or_default()
                    } else {
                        self.job_store.list_jobs(Some("done")).await
                    }
                } else {
                    self.job_store.list_jobs(Some("done")).await
                };

                let text = serde_json::to_string_pretty(&entries)
                    .map_err(|e| format!("Serialization error: {}", e))?;
                Ok(ReadResourceResult {
                    contents: vec![ResourceContent {
                        uri: uri.to_string(),
                        mime_type: "application/json".to_string(),
                        text,
                    }],
                })
            }
            "ytdeck://settings" => {
                let settings_path = JobStore::get_app_data_settings_path();
                let settings_val = if let Some(path) = settings_path {
                    if path.exists() {
                        fs::read_to_string(path)
                            .ok()
                            .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
                            .unwrap_or_else(|| self.default_settings())
                    } else {
                        self.default_settings()
                    }
                } else {
                    self.default_settings()
                };

                let text = serde_json::to_string_pretty(&settings_val)
                    .map_err(|e| format!("Serialization error: {}", e))?;
                Ok(ReadResourceResult {
                    contents: vec![ResourceContent {
                        uri: uri.to_string(),
                        mime_type: "application/json".to_string(),
                        text,
                    }],
                })
            }
            "ytdeck://supported-sites" => {
                let sites = self
                    .tool_manager
                    .get_extractors_list()
                    .await
                    .map_err(|e| format!("Failed to read extractors: {}", e))?;

                let text = serde_json::to_string_pretty(&sites)
                    .map_err(|e| format!("Serialization error: {}", e))?;
                Ok(ReadResourceResult {
                    contents: vec![ResourceContent {
                        uri: uri.to_string(),
                        mime_type: "application/json".to_string(),
                        text,
                    }],
                })
            }
            _ => Err(format!("Resource URI not recognized: {}", uri)),
        }
    }

    fn default_settings(&self) -> serde_json::Value {
        json!({
            "ytdlp_path": self.resolver.resolve_ytdlp().map(|p| p.to_string_lossy().to_string()),
            "ffmpeg_path": self.resolver.resolve_ffmpeg().map(|p| p.to_string_lossy().to_string()),
            "default_download_directory": std::env::var("USERPROFILE")
                .map(|p| format!("{}\\Downloads", p))
                .unwrap_or_else(|_| ".".to_string()),
            "default_format": "bv*+ba/b",
            "max_concurrent_downloads": 3,
            "embed_metadata": true,
            "embed_thumbnail": true
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_list_resources() {
        let resolver = BinaryResolver::new(None, None);
        let store = JobStore::new();
        let tm = ToolManager::new(resolver.clone(), store.clone());
        let rm = ResourceManager::new(store, tm, resolver);

        let list = rm.list_resources();
        assert_eq!(list.len(), 4);
        assert_eq!(list[0].uri, "ytdeck://queue");
        assert_eq!(list[1].uri, "ytdeck://history");
        assert_eq!(list[2].uri, "ytdeck://settings");
        assert_eq!(list[3].uri, "ytdeck://supported-sites");
    }

    #[tokio::test]
    async fn test_read_settings() {
        let resolver = BinaryResolver::new(None, None);
        let store = JobStore::new();
        let tm = ToolManager::new(resolver.clone(), store.clone());
        let rm = ResourceManager::new(store, tm, resolver);

        let res = rm.read_resource("ytdeck://settings").await.unwrap();
        assert_eq!(res.contents.len(), 1);
        assert_eq!(res.contents[0].mime_type, "application/json");
        assert!(res.contents[0].text.contains("default_format"));
    }
}
