use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YtdlpOutputPayload {
    pub job_id: String,
    pub line: String,
    pub is_stderr: bool,
    pub stream: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YtdlpDonePayload {
    pub job_id: String,
    pub exit_code: i32,
    pub success: bool,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpawnResult {
    pub job_id: String,
}

/// Resolves the absolute path to a sidecar binary (`yt-dlp`, `ffmpeg`, `ffprobe`).
/// Follows resolution hierarchy:
/// 1. Direct environment variable override (`YTDECK_YTDLP_PATH`, etc.)
/// 2. Tauri resource directory / bundled binaries
/// 3. Development binaries folder `src-tauri/binaries/`
/// 4. Sibling executable in same folder
/// 5. System PATH lookup
pub fn resolve_sidecar(app: Option<&AppHandle>, name: &str) -> Result<PathBuf, String> {
    let env_var = match name {
        "yt-dlp" => "YTDECK_YTDLP_PATH",
        "ffmpeg" => "YTDECK_FFMPEG_PATH",
        "ffprobe" => "YTDECK_FFPROBE_PATH",
        _ => "",
    };

    if !env_var.is_empty() {
        if let Ok(val) = std::env::var(env_var) {
            let p = PathBuf::from(val);
            if p.exists() {
                return Ok(p);
            }
        }
    }

    #[cfg(target_os = "windows")]
    let exe_name = format!("{}.exe", name);
    #[cfg(not(target_os = "windows"))]
    let exe_name = name.to_string();

    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    let target_triple_name = format!("{}-x86_64-pc-windows-msvc.exe", name);
    #[cfg(not(all(target_os = "windows", target_arch = "x86_64")))]
    let target_triple_name = exe_name.clone();

    // 1. Check relative to current exe
    if let Ok(curr_exe) = std::env::current_exe() {
        if let Some(parent) = curr_exe.parent() {
            let candidates = [
                parent.join(&exe_name),
                parent.join(&target_triple_name),
                parent.join("binaries").join(&target_triple_name),
                parent.join("binaries").join(&exe_name),
                parent.join("resources").join(&exe_name),
            ];
            for cand in candidates {
                if cand.exists() {
                    return Ok(cand);
                }
            }
        }
    }

    // 2. Check Tauri resource dir if app handle is available
    if let Some(app) = app {
        use tauri::Manager;
        if let Ok(res_dir) = app.path().resource_dir() {
            let candidates = [
                res_dir.join(&exe_name),
                res_dir.join(&target_triple_name),
                res_dir.join("binaries").join(&target_triple_name),
                res_dir.join("binaries").join(&exe_name),
            ];
            for cand in candidates {
                if cand.exists() {
                    return Ok(cand);
                }
            }
        }
    }

    // 3. Check development source directories (when running cargo test / cargo dev)
    let dev_dirs = [
        PathBuf::from("src-tauri/binaries"),
        PathBuf::from("binaries"),
        PathBuf::from("../src-tauri/binaries"),
        PathBuf::from("../../src-tauri/binaries"),
    ];

    for dir in &dev_dirs {
        let triple_path = dir.join(&target_triple_name);
        if triple_path.exists() {
            return std::fs::canonicalize(triple_path).map_err(|e| e.to_string());
        }
        let direct_path = dir.join(&exe_name);
        if direct_path.exists() {
            return std::fs::canonicalize(direct_path).map_err(|e| e.to_string());
        }
    }

    // 4. System PATH lookup
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let p = dir.join(&exe_name);
            if p.exists() {
                return Ok(p);
            }
        }
    }

    Err(format!("Could not locate sidecar binary '{}'", name))
}

/// Executes a sidecar in one-shot mode, returning stdout or an error with stderr.
pub async fn run_sidecar_oneshot(
    app: Option<&AppHandle>,
    name: &str,
    args: &[&str],
) -> Result<String, String> {
    let binary_path = resolve_sidecar(app, name)?;

    let mut cmd = Command::new(&binary_path);
    cmd.args(args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        // CREATE_NO_WINDOW = 0x08000000
        cmd.creation_flags(0x08000000);
    }

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to execute '{}': {}", binary_path.display(), e))?;

    if output.status.success() {
        String::from_utf8(output.stdout).map_err(|e| format!("Invalid UTF-8 in stdout: {}", e))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!(
            "Process exited with code {:?}: {}",
            output.status.code(),
            stderr.trim()
        ))
    }
}

/// Spawns `yt-dlp` with the given arguments, streaming stdout/stderr line-by-line via Tauri events.
pub async fn spawn_ytdlp(
    app: AppHandle,
    state: &AppState,
    job_id: String,
    args: Vec<String>,
) -> Result<SpawnResult, String> {
    let binary_path = resolve_sidecar(Some(&app), "yt-dlp")?;

    let mut cmd = Command::new(&binary_path);
    cmd.args(&args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000);
    }

    let mut child = cmd.spawn().map_err(|e| {
        format!(
            "Failed to spawn yt-dlp at '{}': {}",
            binary_path.display(),
            e
        )
    })?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    // Register process in state
    state.register_process(job_id.clone(), child).await;

    let app_clone = app.clone();
    let job_id_stdout = job_id.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let payload = YtdlpOutputPayload {
                job_id: job_id_stdout.clone(),
                line,
                is_stderr: false,
                stream: "stdout".to_string(),
            };
            let _ = app_clone.emit("ytdlp-output", payload);
        }
    });

    let app_clone2 = app.clone();
    let job_id_stderr = job_id.clone();
    let stderr_lines = Arc::new(tokio::sync::Mutex::new(Vec::<String>::new()));
    let stderr_lines_clone = stderr_lines.clone();

    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            {
                let mut lines = stderr_lines_clone.lock().await;
                lines.push(line.clone());
            }
            let payload = YtdlpOutputPayload {
                job_id: job_id_stderr.clone(),
                line,
                is_stderr: true,
                stream: "stderr".to_string(),
            };
            let _ = app_clone2.emit("ytdlp-output", payload);
        }
    });

    // Monitor completion task
    let app_clone3 = app.clone();
    let job_id_mon = job_id.clone();
    let procs_arc = state.processes.clone();
    let statuses_arc = state.job_statuses.clone();

    tokio::spawn(async move {
        let child_arc = {
            let procs = procs_arc.lock().await;
            procs.get(&job_id_mon).cloned()
        };

        let (exit_code, success) = if let Some(child_arc) = child_arc {
            let mut child = child_arc.lock().await;
            match child.wait().await {
                Ok(status) => (status.code().unwrap_or(-1), status.success()),
                Err(_) => (-1, false),
            }
        } else {
            (-1, false)
        };

        // Remove from process map
        {
            let mut procs = procs_arc.lock().await;
            procs.remove(&job_id_mon);
        }

        // Update status
        let final_status = if success { "done" } else { "error" };
        if let Ok(mut statuses) = statuses_arc.lock() {
            statuses.insert(job_id_mon.clone(), final_status.to_string());
        }

        let err_msg = if !success {
            let lines = stderr_lines.lock().await;
            if lines.is_empty() {
                Some(format!("Process exited with code {}", exit_code))
            } else {
                Some(lines.join("\n"))
            }
        } else {
            None
        };

        let done_payload = YtdlpDonePayload {
            job_id: job_id_mon,
            exit_code,
            success,
            error_message: err_msg,
        };

        let _ = app_clone3.emit("ytdlp-done", done_payload);
    });

    Ok(SpawnResult { job_id })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_sidecars() {
        let ytdlp = resolve_sidecar(None, "yt-dlp");
        assert!(
            ytdlp.is_ok(),
            "yt-dlp resolution should succeed: {:?}",
            ytdlp
        );

        let ffmpeg = resolve_sidecar(None, "ffmpeg");
        assert!(
            ffmpeg.is_ok(),
            "ffmpeg resolution should succeed: {:?}",
            ffmpeg
        );

        let ffprobe = resolve_sidecar(None, "ffprobe");
        assert!(
            ffprobe.is_ok(),
            "ffprobe resolution should succeed: {:?}",
            ffprobe
        );
    }

    #[tokio::test]
    async fn test_run_sidecar_version() {
        let out = run_sidecar_oneshot(None, "yt-dlp", &["--version"]).await;
        assert!(out.is_ok(), "yt-dlp --version should succeed: {:?}", out);
        let version = out.unwrap();
        assert!(!version.trim().is_empty());
    }

    #[tokio::test]
    async fn test_run_ffmpeg_version() {
        let out = run_sidecar_oneshot(None, "ffmpeg", &["-version"]).await;
        assert!(out.is_ok(), "ffmpeg -version should succeed: {:?}", out);
        let version = out.unwrap();
        assert!(version.contains("ffmpeg version"));
    }
}
