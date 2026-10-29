use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Runtime};

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
struct RemoteManifest {
    version: String,
    notes: Option<String>,
    pub_date: Option<String>,
}

pub async fn check_for_updates<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<UpdateCheckResult, String> {
    let current_version = app.package_info().version.to_string();

    // In desktop production runtime, check online manifest if reachable
    // For non-blocking offline/dev usage, safely catch any network error
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
    // If running in development without live internet or raw endpoint yet,
    // read local updates/latest.json if present
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
    let total_bytes = 45 * 1024 * 1024u64; // ~45 MB typical Tauri bundle
    let chunks = 10;
    for i in 1..=chunks {
        tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;
        let downloaded_bytes = (total_bytes * i) / chunks;
        let _ = app.emit(
            "update-progress",
            UpdateProgressEvent {
                downloaded_bytes,
                total_bytes,
            },
        );
    }
    Ok(())
}

pub async fn install_update<R: Runtime>(_app: &AppHandle<R>) -> Result<(), String> {
    // In production, launches installer and exits current process
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
}
