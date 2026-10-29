use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{AppHandle, State};
use uuid::Uuid;

use crate::sidecar::{self, run_sidecar_oneshot, SpawnResult};
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCheckResult {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub release_notes: Option<String>,
    pub pub_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YtdlpFormatItem {
    pub format_id: String,
    pub ext: String,
    pub resolution: Option<String>,
    pub fps: Option<f64>,
    pub filesize: Option<u64>,
    pub tbr: Option<f64>,
    pub vcodec: Option<String>,
    pub acodec: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YtdlpInfoResult {
    pub id: String,
    pub title: String,
    pub uploader: Option<String>,
    pub duration: Option<f64>,
    pub thumbnail: Option<String>,
    pub formats: Vec<YtdlpFormatItem>,
}

#[tauri::command]
pub async fn spawn_ytdlp(
    app: AppHandle,
    state: State<'_, AppState>,
    job_id: Option<String>,
    args: Vec<String>,
) -> Result<SpawnResult, String> {
    let id = job_id.unwrap_or_else(|| Uuid::new_v4().to_string());
    sidecar::spawn_ytdlp(app, &state, id, args).await
}

#[tauri::command]
pub async fn cancel_download(state: State<'_, AppState>, job_id: String) -> Result<(), String> {
    let killed = state.kill_process(&job_id).await;
    if killed {
        Ok(())
    } else {
        // Even if process wasn't in active map, mark as cancelled in statuses
        state.set_job_status(&job_id, "cancelled");
        Ok(())
    }
}

#[tauri::command]
pub async fn pause_download(state: State<'_, AppState>, job_id: String) -> Result<(), String> {
    // Set status to paused before killing so that the completion monitor detects it
    state.set_job_status(&job_id, "paused");
    let _ = state.kill_process(&job_id).await;
    state.set_job_status(&job_id, "paused");
    Ok(())
}

#[tauri::command]
pub async fn resume_download(
    app: AppHandle,
    state: State<'_, AppState>,
    job_id: String,
) -> Result<(), String> {
    state.set_job_status(&job_id, "downloading");

    // If child process is not running, respawn yt-dlp with saved arguments
    let is_running = {
        let procs = state.processes.lock().await;
        procs.contains_key(&job_id)
    };

    if !is_running {
        if let Some(args) = state.get_job_args(&job_id) {
            sidecar::spawn_ytdlp(app, &state, job_id, args).await?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn fetch_info(app: AppHandle, url: String) -> Result<serde_json::Value, String> {
    let output = run_sidecar_oneshot(
        Some(&app),
        "yt-dlp",
        &["-j", "--no-playlist", "--skip-download", &url],
    )
    .await?;

    serde_json::from_str(&output)
        .map_err(|e| format!("Failed to parse JSON info from yt-dlp: {}", e))
}

#[tauri::command]
pub async fn fetch_formats(app: AppHandle, url: String) -> Result<String, String> {
    run_sidecar_oneshot(Some(&app), "yt-dlp", &["-F", "--no-playlist", &url]).await
}

#[tauri::command]
pub async fn check_update(app: AppHandle) -> Result<crate::updater::UpdateCheckResult, String> {
    crate::updater::check_for_updates(&app).await
}

#[tauri::command]
pub async fn download_update(app: AppHandle) -> Result<(), String> {
    crate::updater::download_update(&app).await
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    crate::updater::install_update(&app).await
}

#[tauri::command]
pub async fn update_ytdlp_sidecar(app: AppHandle) -> Result<String, String> {
    run_sidecar_oneshot(Some(&app), "yt-dlp", &["-U"]).await
}

#[tauri::command]
pub async fn open_path(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    #[cfg(target_os = "windows")]
    {
        let is_dir = p.is_dir();
        let arg = if is_dir {
            path
        } else {
            format!("/select,\"{}\"", path)
        };
        std::process::Command::new("explorer")
            .arg(arg)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open path: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_app_version(app: AppHandle) -> Result<String, String> {
    Ok(app.package_info().version.to_string())
}

#[tauri::command]
pub async fn get_ytdlp_version(app: AppHandle) -> Result<String, String> {
    let out = run_sidecar_oneshot(Some(&app), "yt-dlp", &["--version"]).await?;
    Ok(out.trim().to_string())
}

#[tauri::command]
pub async fn update_tray_status(
    app: AppHandle,
    active_count: u32,
    speed: Option<String>,
) -> Result<(), String> {
    crate::tray::update_tray(&app, active_count, speed.as_deref())
}
