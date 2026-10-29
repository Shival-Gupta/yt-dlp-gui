use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex as StdMutex;
use tokio::process::Child;
use tokio::sync::Mutex as TokioMutex;

#[derive(Default)]
pub struct AppState {
    pub processes: Arc<TokioMutex<HashMap<String, Arc<TokioMutex<Child>>>>>,
    pub job_statuses: Arc<StdMutex<HashMap<String, String>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(TokioMutex::new(HashMap::new())),
            job_statuses: Arc::new(StdMutex::new(HashMap::new())),
        }
    }

    pub async fn register_process(&self, job_id: String, child: Child) {
        let mut procs = self.processes.lock().await;
        procs.insert(job_id.clone(), Arc::new(TokioMutex::new(child)));
        if let Ok(mut statuses) = self.job_statuses.lock() {
            statuses.insert(job_id, "downloading".to_string());
        }
    }

    pub async fn kill_process(&self, job_id: &str) -> bool {
        let child_arc = {
            let mut procs = self.processes.lock().await;
            procs.remove(job_id)
        };

        if let Some(child_arc) = child_arc {
            let mut child = child_arc.lock().await;
            let _ = child.kill().await;
            if let Ok(mut statuses) = self.job_statuses.lock() {
                statuses.insert(job_id.to_string(), "cancelled".to_string());
            }
            true
        } else {
            false
        }
    }

    pub async fn remove_process(&self, job_id: &str) {
        let mut procs = self.processes.lock().await;
        procs.remove(job_id);
    }

    pub fn set_job_status(&self, job_id: &str, status: &str) {
        if let Ok(mut statuses) = self.job_statuses.lock() {
            statuses.insert(job_id.to_string(), status.to_string());
        }
    }

    pub fn get_job_status(&self, job_id: &str) -> Option<String> {
        if let Ok(statuses) = self.job_statuses.lock() {
            statuses.get(job_id).cloned()
        } else {
            None
        }
    }
}
