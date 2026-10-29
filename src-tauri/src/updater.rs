use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Runtime};
use tokio::io::AsyncWriteExt;

pub const UPDATER_ENDPOINT: &str =
    "https://raw.githubusercontent.com/Shival-Gupta/yt-dlp-gui/main/updates/latest.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCheckResult {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub release_notes: Option<String>,
    pub pub_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAvailableEvent {
    pub version: String,
    pub notes: String,
    pub pub_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProgressEvent {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PlatformInfo {
    pub url: String,
    #[serde(default)]
    pub signature: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RemoteManifest {
    pub version: String,
    pub notes: Option<String>,
    pub pub_date: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub platforms: HashMap<String, PlatformInfo>,
}

impl RemoteManifest {
    pub fn get_installer_url(&self) -> Option<String> {
        if let Some(u) = &self.url {
            return Some(u.clone());
        }
        if let Some(p) = self.platforms.get("windows-x86_64") {
            return Some(p.url.clone());
        }
        self.platforms.values().next().map(|p| p.url.clone())
    }
}

pub async fn check_for_updates<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<UpdateCheckResult, String> {
    let current_version = app.package_info().version.to_string();

    // Check remote manifest first, with local fallback for offline/dev
    let latest_info = fetch_remote_manifest().await;

    if let Ok(remote) = latest_info {
        let is_newer = is_newer_version(&remote.version, &current_version);
        if is_newer {
            let _ = app.emit(
                "update-available",
                UpdateAvailableEvent {
                    version: remote.version.clone(),
                    notes: remote.notes.clone().unwrap_or_default(),
                    pub_date: remote.pub_date.clone(),
                },
            );

            return Ok(UpdateCheckResult {
                available: true,
                current_version,
                latest_version: Some(remote.version),
                release_notes: remote.notes,
                pub_date: remote.pub_date,
            });
        }
    }

    Ok(UpdateCheckResult {
        available: false,
        current_version,
        latest_version: None,
        release_notes: None,
        pub_date: None,
    })
}

async fn fetch_remote_manifest() -> Result<RemoteManifest, String> {
    // Attempt HTTP GET from UPDATER_ENDPOINT
    let client_res = reqwest::Client::builder()
        .user_agent("yt-dlp-gui-updater")
        .timeout(std::time::Duration::from_secs(10))
        .build();

    if let Ok(client) = client_res {
        if let Ok(resp) = client.get(UPDATER_ENDPOINT).send().await {
            if resp.status().is_success() {
                if let Ok(manifest) = resp.json::<RemoteManifest>().await {
                    return Ok(manifest);
                }
            }
        }
    }

    // Fallback to local updates/latest.json if offline or in development
    if let Ok(content) = std::fs::read_to_string("updates/latest.json") {
        if let Ok(manifest) = serde_json::from_str::<RemoteManifest>(&content) {
            return Ok(manifest);
        }
    }

    Err("Could not reach update server".to_string())
}

fn is_newer_version(remote: &str, current: &str) -> bool {
    let r_parts: Vec<u32> = remote
        .trim_start_matches('v')
        .split('.')
        .filter_map(|p| p.parse().ok())
        .collect();
    let c_parts: Vec<u32> = current
        .trim_start_matches('v')
        .split('.')
        .filter_map(|p| p.parse().ok())
        .collect();

    for i in 0..r_parts.len().max(c_parts.len()) {
        let r = r_parts.get(i).copied().unwrap_or(0);
        let c = c_parts.get(i).copied().unwrap_or(0);
        if r > c {
            return true;
        } else if r < c {
            return false;
        }
    }

    false
}

pub async fn download_update<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let manifest = fetch_remote_manifest().await?;
    let download_url = manifest
        .get_installer_url()
        .ok_or_else(|| "No installer download URL found in update manifest".to_string())?;

    let temp_dir = std::env::temp_dir();
    let target_path = temp_dir.join("YTDeck-Setup-Update.exe");

    let client = reqwest::Client::builder()
        .user_agent("yt-dlp-gui-updater")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Attempt streaming download from remote URL
    match client.get(&download_url).send().await {
        Ok(resp) if resp.status().is_success() => {
            let total_bytes = resp.content_length().unwrap_or(0);
            let mut file = tokio::fs::File::create(&target_path)
                .await
                .map_err(|e| format!("Failed to create temporary installer file: {}", e))?;

            let mut downloaded_bytes: u64 = 0;
            let mut stream_resp = resp;

            while let Some(chunk) = stream_resp
                .chunk()
                .await
                .map_err(|e| format!("Download stream error: {}", e))?
            {
                file.write_all(&chunk)
                    .await
                    .map_err(|e| format!("Failed to write chunk: {}", e))?;
                downloaded_bytes += chunk.len() as u64;

                let _ = app.emit(
                    "update-progress",
                    UpdateProgressEvent {
                        downloaded_bytes,
                        total_bytes: if total_bytes > 0 {
                            total_bytes
                        } else {
                            downloaded_bytes
                        },
                    },
                );
            }

            file.flush()
                .await
                .map_err(|e| format!("Failed to flush installer file: {}", e))?;
            Ok(())
        }
        _ => {
            // Offline / dev fallback: if local installer exists or update file can be prepared
            let local_candidates = [
                "installer/YTDeck-Setup.exe",
                "target/release/YTDeck-Setup.exe",
                "updates/YTDeck-Setup.exe",
            ];
            for candidate in &local_candidates {
                if let Ok(data) = std::fs::read(candidate) {
                    std::fs::write(&target_path, &data)
                        .map_err(|e| format!("Failed to copy installer: {}", e))?;
                    let total = data.len() as u64;
                    let _ = app.emit(
                        "update-progress",
                        UpdateProgressEvent {
                            downloaded_bytes: total,
                            total_bytes: total,
                        },
                    );
                    return Ok(());
                }
            }
            Err("Failed to stream update installer from remote URL".to_string())
        }
    }
}

pub async fn install_update<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let temp_dir = std::env::temp_dir();
    let installer_path = temp_dir.join("YTDeck-Setup-Update.exe");
    if !installer_path.exists() {
        return Err(format!(
            "Installer not found at {}",
            installer_path.display()
        ));
    }

    std::process::Command::new(&installer_path)
        .spawn()
        .map_err(|e| format!("Failed to launch installer: {}", e))?;

    app.exit(0);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_comparison() {
        assert!(is_newer_version("1.1.0", "1.0.0"));
        assert!(is_newer_version("2.0.0", "1.9.9"));
        assert!(is_newer_version("1.0.1", "1.0.0"));
        assert!(!is_newer_version("1.0.0", "1.0.0"));
        assert!(!is_newer_version("1.0.0", "1.0.1"));
        assert!(!is_newer_version("0.9.9", "1.0.0"));
    }

    #[tokio::test]
    async fn test_manifest_fallback_reading() {
        let manifest = fetch_remote_manifest().await;
        // In local dev, fetch_remote_manifest finds updates/latest.json
        assert!(manifest.is_ok(), "Manifest reading should succeed: {:?}", manifest);
        let m = manifest.unwrap();
        assert_eq!(m.version, "1.0.0");
        assert!(m.get_installer_url().is_some());
    }
}
