use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use tracing::{info, warn};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum JobStatus {
    Queued,
    Downloading,
    Done,
    Error,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobInfo {
    pub job_id: String,
    pub url: String,
    pub status: JobStatus,
    pub progress: f64,
    pub speed: Option<String>,
    pub eta: Option<String>,
    pub output_path: Option<String>,
    pub error: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone)]
pub struct JobStore {
    jobs: Arc<RwLock<HashMap<String, JobInfo>>>,
    pids: Arc<Mutex<HashMap<String, u32>>>,
}

impl Default for JobStore {
    fn default() -> Self {
        Self::new()
    }
}

impl JobStore {
    pub fn new() -> Self {
        Self {
            jobs: Arc::new(RwLock::new(HashMap::new())),
            pids: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn create_job(&self, url: String) -> String {
        let job_id = Uuid::new_v4().to_string();
        let now = now_iso();
        let info = JobInfo {
            job_id: job_id.clone(),
            url,
            status: JobStatus::Queued,
            progress: 0.0,
            speed: None,
            eta: None,
            output_path: None,
            error: None,
            created_at: now.clone(),
            updated_at: now,
        };

        let mut lock = self.jobs.write().await;
        lock.insert(job_id.clone(), info);
        job_id
    }

    pub async fn register_pid(&self, job_id: &str, pid: u32) {
        let mut lock = self.pids.lock().await;
        lock.insert(job_id.to_string(), pid);
    }

    pub async fn unregister_pid(&self, job_id: &str) {
        let mut lock = self.pids.lock().await;
        lock.remove(job_id);
    }

    pub async fn update_status(&self, job_id: &str, status: JobStatus, error: Option<String>) {
        let mut lock = self.jobs.write().await;
        if let Some(job) = lock.get_mut(job_id) {
            job.status = status;
            job.updated_at = now_iso();
            if let Some(err) = error {
                job.error = Some(err);
            }
            if status == JobStatus::Done {
                job.progress = 100.0;
            }
        }
    }

    pub async fn update_output_path(&self, job_id: &str, path: String) {
        let mut lock = self.jobs.write().await;
        if let Some(job) = lock.get_mut(job_id) {
            job.output_path = Some(path);
            job.updated_at = now_iso();
        }
    }

    pub async fn parse_and_update_line(&self, job_id: &str, line: &str) {
        let mut lock = self.jobs.write().await;
        if let Some(job) = lock.get_mut(job_id) {
            let trimmed = line.trim();

            if trimmed.starts_with("[download]") {
                if job.status == JobStatus::Queued {
                    job.status = JobStatus::Downloading;
                }

                // Extract percent only from [download] lines
                static RE_PERCENT: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
                let re_pct = RE_PERCENT.get_or_init(|| Regex::new(r"([0-9.]+)%").unwrap());
                if let Some(caps) = re_pct.captures(trimmed) {
                    if let Ok(val) = caps[1].parse::<f64>() {
                        job.progress = val;
                    }
                }

                // Extract speed
                static RE_SPEED: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
                let re_spd =
                    RE_SPEED.get_or_init(|| Regex::new(r"at\s+([0-9.]+\s*[KMGT]?i?B/s)").unwrap());
                if let Some(caps) = re_spd.captures(trimmed) {
                    job.speed = Some(caps[1].trim().to_string());
                }

                // Extract ETA
                static RE_ETA: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
                let re_eta = RE_ETA.get_or_init(|| Regex::new(r"ETA\s+([0-9:]+)").unwrap());
                if let Some(caps) = re_eta.captures(trimmed) {
                    job.eta = Some(caps[1].trim().to_string());
                }
            }

            // Extract destination file path
            static RE_DEST: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
            let re_dst = RE_DEST.get_or_init(|| {
                Regex::new(r#"(?:Destination:\s*|Merging formats into ")([^"\r\n]+)"?"#).unwrap()
            });
            if let Some(caps) = re_dst.captures(line) {
                let path = caps[1].trim().to_string();
                if !path.is_empty() {
                    job.output_path = Some(path);
                }
            }

            job.updated_at = now_iso();
        }
    }

    pub async fn get_job(&self, job_id: &str) -> Option<JobInfo> {
        let lock = self.jobs.read().await;
        lock.get(job_id).cloned()
    }

    pub async fn list_jobs(&self, filter: Option<&str>) -> Vec<JobInfo> {
        let lock = self.jobs.read().await;
        let mut list: Vec<JobInfo> = lock.values().cloned().collect();
        list.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        match filter.map(|s| s.to_lowercase()) {
            Some(f) if f == "active" || f == "downloading" => list
                .into_iter()
                .filter(|j| j.status == JobStatus::Downloading || j.status == JobStatus::Queued)
                .collect(),
            Some(f) if f == "done" => list
                .into_iter()
                .filter(|j| j.status == JobStatus::Done)
                .collect(),
            Some(f) if f == "error" => list
                .into_iter()
                .filter(|j| j.status == JobStatus::Error)
                .collect(),
            Some(f) if f == "cancelled" => list
                .into_iter()
                .filter(|j| j.status == JobStatus::Cancelled)
                .collect(),
            _ => list,
        }
    }

    pub async fn cancel_job(&self, job_id: &str) -> Result<bool, String> {
        let pid_opt = {
            let mut pids_lock = self.pids.lock().await;
            pids_lock.remove(job_id)
        };

        if let Some(pid) = pid_opt {
            info!(job_id = %job_id, pid = %pid, "Terminating process tree for cancelled job");
            kill_process_tree(pid);
        }

        let mut jobs_lock = self.jobs.write().await;
        if let Some(job) = jobs_lock.get_mut(job_id) {
            job.status = JobStatus::Cancelled;
            job.updated_at = now_iso();
            Ok(true)
        } else {
            Err(format!("Job '{}' not found", job_id))
        }
    }

    pub fn get_app_data_history_path() -> Option<PathBuf> {
        if let Ok(app_data) = std::env::var("APPDATA") {
            let dir = PathBuf::from(app_data).join("com.shival-gupta.yt-dlp-gui");
            Some(dir.join("history.json"))
        } else if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
            let dir = PathBuf::from(home).join(".config").join("yt-dlp-gui");
            Some(dir.join("history.json"))
        } else {
            None
        }
    }

    pub fn get_app_data_settings_path() -> Option<PathBuf> {
        if let Ok(app_data) = std::env::var("APPDATA") {
            let dir = PathBuf::from(app_data).join("com.shival-gupta.yt-dlp-gui");
            Some(dir.join("settings.json"))
        } else if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
            let dir = PathBuf::from(home).join(".config").join("yt-dlp-gui");
            Some(dir.join("settings.json"))
        } else {
            None
        }
    }

    pub async fn append_to_history(&self, job: &JobInfo) {
        if let Some(history_file) = Self::get_app_data_history_path() {
            if let Some(parent) = history_file.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let mut entries: Vec<JobInfo> = if history_file.exists() {
                fs::read_to_string(&history_file)
                    .ok()
                    .and_then(|data| serde_json::from_str(&data).ok())
                    .unwrap_or_default()
            } else {
                Vec::new()
            };

            entries.retain(|e| e.job_id != job.job_id);
            entries.insert(0, job.clone());
            if entries.len() > 500 {
                entries.truncate(500);
            }

            if let Ok(json_str) = serde_json::to_string_pretty(&entries) {
                let _ = fs::write(history_file, json_str);
            }
        }
    }
}

pub fn kill_process_tree(pid: u32) {
    #[cfg(windows)]
    {
        let output = std::process::Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
        if let Err(err) = output {
            warn!(pid = %pid, error = %err, "Failed to execute taskkill");
        }
    }

    #[cfg(not(windows))]
    {
        let output = std::process::Command::new("kill")
            .args(["-9", &pid.to_string()])
            .output();
        if let Err(err) = output {
            warn!(pid = %pid, error = %err, "Failed to execute kill");
        }
    }
}

fn now_iso() -> String {
    // Standard UTC ISO timestamp
    let now = std::time::SystemTime::now();
    let duration = now
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();
    let days = secs / 86400;
    let rem_secs = secs % 86400;
    let hours = rem_secs / 3600;
    let mins = (rem_secs % 3600) / 60;
    let s = rem_secs % 60;
    format!(
        "1970-01-01T00:00:00Z + {}d {}h {}m {}s",
        days, hours, mins, s
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_job_lifecycle() {
        let store = JobStore::new();
        let job_id = store
            .create_job("https://youtube.com/watch?v=123".into())
            .await;

        let job = store.get_job(&job_id).await.unwrap();
        assert_eq!(job.status, JobStatus::Queued);
        assert_eq!(job.progress, 0.0);

        store
            .parse_and_update_line(
                &job_id,
                "[download]  25.4% of ~50.00MiB at 3.50MiB/s ETA 00:10",
            )
            .await;
        let updated = store.get_job(&job_id).await.unwrap();
        assert_eq!(updated.status, JobStatus::Downloading);
        assert!((updated.progress - 25.4).abs() < 0.01);
        assert_eq!(updated.speed.as_deref(), Some("3.50MiB/s"));
        assert_eq!(updated.eta.as_deref(), Some("00:10"));

        store.update_status(&job_id, JobStatus::Done, None).await;
        let done = store.get_job(&job_id).await.unwrap();
        assert_eq!(done.status, JobStatus::Done);
        assert_eq!(done.progress, 100.0);
    }

    #[tokio::test]
    async fn test_cancel_job() {
        let store = JobStore::new();
        let job_id = store
            .create_job("https://youtube.com/watch?v=456".into())
            .await;
        let cancelled = store.cancel_job(&job_id).await.unwrap();
        assert!(cancelled);

        let job = store.get_job(&job_id).await.unwrap();
        assert_eq!(job.status, JobStatus::Cancelled);
    }
}
