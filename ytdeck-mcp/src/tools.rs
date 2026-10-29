use crate::jobs::{JobStatus, JobStore};
use crate::protocol::{CallToolResult, ToolDefinition};
use crate::resolution::BinaryResolver;
use serde_json::{json, Value};
use std::process::Stdio;
use std::sync::Arc;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::RwLock;
use tracing::{error, info};

type ExtractorsCache = Arc<RwLock<Option<(std::time::Instant, Vec<String>)>>>;

#[derive(Clone)]
pub struct ToolManager {
    resolver: BinaryResolver,
    job_store: JobStore,
    cached_extractors: ExtractorsCache,
}

impl ToolManager {
    pub fn new(resolver: BinaryResolver, job_store: JobStore) -> Self {
        Self {
            resolver,
            job_store,
            cached_extractors: Arc::new(RwLock::new(None)),
        }
    }

    pub fn list_tools(&self) -> Vec<ToolDefinition> {
        vec![
            ToolDefinition {
                name: "download".to_string(),
                description: "Download media from a URL using yt-dlp asynchronously. Supports YouTube, Instagram, Twitter/X, TikTok, and 1750+ other sites.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["url"],
                    "properties": {
                        "url": { "type": "string", "description": "URL to download" },
                        "format": { "type": "string", "description": "Format selector e.g. 'bv*+ba/b' or '137+140'" },
                        "output_dir": { "type": "string", "description": "Output directory path" },
                        "output_template": { "type": "string", "description": "Filename template e.g. '%(title)s.%(ext)s'" },
                        "extract_audio": { "type": "boolean", "description": "Extract audio track only" },
                        "audio_format": {
                            "type": "string",
                            "enum": ["mp3", "m4a", "flac", "wav", "opus", "aac", "vorbis"],
                            "description": "Audio format for extraction (requires ffmpeg)"
                        },
                        "write_subs": { "type": "boolean", "description": "Download subtitles" },
                        "write_thumbnail": { "type": "boolean", "description": "Download thumbnail image" },
                        "embed_metadata": { "type": "boolean", "description": "Embed metadata into output file" },
                        "cookies_from_browser": { "type": "string", "description": "Browser name to extract cookies from: chrome, firefox, edge, brave, opera, vivaldi, safari" },
                        "extra_args": {
                            "type": "array",
                            "items": { "type": "string" },
                            "description": "Additional raw arguments to pass to yt-dlp"
                        }
                    }
                }),
            },
            ToolDefinition {
                name: "get_job_status".to_string(),
                description: "Get current progress and status of an active or completed download job.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["job_id"],
                    "properties": {
                        "job_id": { "type": "string", "description": "UUID of the download job" }
                    }
                }),
            },
            ToolDefinition {
                name: "cancel_job".to_string(),
                description: "Cancel an active download job and terminate its process tree.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["job_id"],
                    "properties": {
                        "job_id": { "type": "string", "description": "UUID of the download job to cancel" }
                    }
                }),
            },
            ToolDefinition {
                name: "list_jobs".to_string(),
                description: "List tracked download jobs with optional status filter.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["all", "active", "downloading", "queued", "done", "error", "cancelled"],
                            "description": "Optional filter for job status (default: 'all')"
                        }
                    }
                }),
            },
            ToolDefinition {
                name: "fetch_info".to_string(),
                description: "Fetch complete JSON metadata for a video URL using yt-dlp -j without downloading media.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["url"],
                    "properties": {
                        "url": { "type": "string", "description": "URL to inspect" }
                    }
                }),
            },
            ToolDefinition {
                name: "fetch_formats".to_string(),
                description: "Fetch available video/audio formats for a URL using yt-dlp -F, returning both raw table and parsed formats.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["url"],
                    "properties": {
                        "url": { "type": "string", "description": "URL to inspect" }
                    }
                }),
            },
            ToolDefinition {
                name: "fetch_thumbnails".to_string(),
                description: "Extract available thumbnails and resolutions for a media URL.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["url"],
                    "properties": {
                        "url": { "type": "string", "description": "URL to inspect" }
                    }
                }),
            },
            ToolDefinition {
                name: "search".to_string(),
                description: "Search supported media platforms (YouTube, YouTube Music, SoundCloud) using yt-dlp search prefixes.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["query"],
                    "properties": {
                        "query": { "type": "string", "description": "Search query keywords" },
                        "engine": {
                            "type": "string",
                            "enum": ["youtube", "ytmusic", "soundcloud"],
                            "description": "Search engine prefix (default: 'youtube')"
                        },
                        "count": { "type": "integer", "description": "Number of results to return (default: 5)" }
                    }
                }),
            },
            ToolDefinition {
                name: "check_dependency".to_string(),
                description: "Check if a required or optional CLI dependency is installed and report its version and path.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["name"],
                    "properties": {
                        "name": {
                            "type": "string",
                            "enum": ["ytdlp", "yt-dlp", "ffmpeg", "ffprobe", "deno", "node", "aria2c", "atomicparsley"],
                            "description": "Name of the dependency to check"
                        }
                    }
                }),
            },
            ToolDefinition {
                name: "get_supported_sites".to_string(),
                description: "Get list of supported extractors from yt-dlp --list-extractors with pagination and search filter.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "properties": {
                        "search": { "type": "string", "description": "Case-insensitive filter term" },
                        "page": { "type": "integer", "description": "0-based page index (default: 0)" },
                        "per_page": { "type": "integer", "description": "Number of extractors per page (default: 50)" }
                    }
                }),
            },
            ToolDefinition {
                name: "build_command".to_string(),
                description: "Reconstruct and preview the exact yt-dlp CLI command and arguments without running it (dry-run).".to_string(),
                input_schema: json!({
                    "type": "object",
                    "required": ["url"],
                    "properties": {
                        "url": { "type": "string", "description": "URL to download" },
                        "format": { "type": "string", "description": "Format selector e.g. 'bv*+ba/b'" },
                        "output_dir": { "type": "string", "description": "Output directory" },
                        "output_template": { "type": "string", "description": "Filename template" },
                        "extract_audio": { "type": "boolean", "description": "Extract audio only" },
                        "audio_format": { "type": "string", "enum": ["mp3", "m4a", "flac", "wav", "opus", "aac", "vorbis"] },
                        "write_subs": { "type": "boolean", "description": "Download subtitles" },
                        "write_thumbnail": { "type": "boolean", "description": "Download thumbnail" },
                        "embed_metadata": { "type": "boolean", "description": "Embed metadata" },
                        "cookies_from_browser": { "type": "string", "description": "Browser name for cookies" },
                        "extra_args": { "type": "array", "items": { "type": "string" }, "description": "Additional CLI args" }
                    }
                }),
            },
            ToolDefinition {
                name: "update_ytdlp".to_string(),
                description: "Run yt-dlp -U to self-update yt-dlp to the latest version.".to_string(),
                input_schema: json!({
                    "type": "object",
                    "properties": {}
                }),
            },
        ]
    }

    pub async fn call_tool(&self, name: &str, params: Value) -> CallToolResult {
        match name {
            "download" => self.tool_download(params).await,
            "get_job_status" => self.tool_get_job_status(params).await,
            "cancel_job" => self.tool_cancel_job(params).await,
            "list_jobs" => self.tool_list_jobs(params).await,
            "fetch_info" => self.tool_fetch_info(params).await,
            "fetch_formats" => self.tool_fetch_formats(params).await,
            "fetch_thumbnails" => self.tool_fetch_thumbnails(params).await,
            "search" => self.tool_search(params).await,
            "check_dependency" => self.tool_check_dependency(params).await,
            "get_supported_sites" => self.tool_get_supported_sites(params).await,
            "build_command" => self.tool_build_command(params).await,
            "update_ytdlp" => self.tool_update_ytdlp().await,
            _ => CallToolResult::error(format!("Unknown tool: {}", name)),
        }
    }

    fn build_ytdlp_args(&self, params: &Value) -> Result<(String, Vec<String>), String> {
        let url = params
            .get("url")
            .and_then(Value::as_str)
            .ok_or_else(|| "Missing required parameter 'url'".to_string())?;

        let mut args = Vec::new();

        if let Some(fmt) = params.get("format").and_then(Value::as_str) {
            args.push("-f".to_string());
            args.push(fmt.to_string());
        }

        if let Some(dir) = params.get("output_dir").and_then(Value::as_str) {
            args.push("-P".to_string());
            args.push(dir.to_string());
        }

        if let Some(tpl) = params.get("output_template").and_then(Value::as_str) {
            args.push("-o".to_string());
            args.push(tpl.to_string());
        }

        if params
            .get("extract_audio")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            args.push("-x".to_string());
        }

        if let Some(afmt) = params.get("audio_format").and_then(Value::as_str) {
            args.push("--audio-format".to_string());
            args.push(afmt.to_string());
        }

        if params
            .get("write_subs")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            args.push("--write-subs".to_string());
        }

        if params
            .get("write_thumbnail")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            args.push("--write-thumbnail".to_string());
        }

        if params
            .get("embed_metadata")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            args.push("--embed-metadata".to_string());
        }

        if let Some(browser) = params.get("cookies_from_browser").and_then(Value::as_str) {
            args.push("--cookies-from-browser".to_string());
            args.push(browser.to_string());
        }

        if let Some(extra) = params.get("extra_args").and_then(Value::as_array) {
            for item in extra {
                if let Some(s) = item.as_str() {
                    args.push(s.to_string());
                }
            }
        }

        args.push(url.to_string());
        Ok((url.to_string(), args))
    }

    async fn tool_download(&self, params: Value) -> CallToolResult {
        let (url, args) = match self.build_ytdlp_args(&params) {
            Ok(res) => res,
            Err(e) => return CallToolResult::error(e),
        };

        let ytdlp_path = match self.resolver.resolve_ytdlp() {
            Some(path) => path,
            None => {
                return CallToolResult::error(
                    "yt-dlp binary not found. Please specify --ytdlp-path, set YTDECK_YTDLP_PATH, or place yt-dlp in PATH."
                );
            }
        };

        let job_id = self.job_store.create_job(url.clone()).await;
        let job_id_clone = job_id.clone();
        let job_store = self.job_store.clone();

        // Spawn background task
        tokio::spawn(async move {
            info!(job_id = %job_id_clone, binary = ?ytdlp_path, args = ?args, "Starting yt-dlp download");

            let mut cmd = Command::new(&ytdlp_path);
            cmd.args(&args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped());

            // Avoid opening console windows on Windows
            #[cfg(windows)]
            {
                cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
            }

            match cmd.spawn() {
                Ok(mut child) => {
                    if let Some(pid) = child.id() {
                        job_store.register_pid(&job_id_clone, pid).await;
                    }

                    let stdout = child.stdout.take();
                    let stderr = child.stderr.take();

                    let job_id_out = job_id_clone.clone();
                    let store_out = job_store.clone();
                    if let Some(out) = stdout {
                        tokio::spawn(async move {
                            let mut reader = BufReader::new(out).lines();
                            while let Ok(Some(line)) = reader.next_line().await {
                                store_out.parse_and_update_line(&job_id_out, &line).await;
                            }
                        });
                    }

                    let job_id_err = job_id_clone.clone();
                    let store_err = job_store.clone();
                    if let Some(err) = stderr {
                        tokio::spawn(async move {
                            let mut reader = BufReader::new(err).lines();
                            while let Ok(Some(line)) = reader.next_line().await {
                                store_err.parse_and_update_line(&job_id_err, &line).await;
                            }
                        });
                    }

                    match child.wait().await {
                        Ok(status) => {
                            job_store.unregister_pid(&job_id_clone).await;
                            let current = job_store.get_job(&job_id_clone).await;
                            if let Some(job) = current {
                                if job.status != JobStatus::Cancelled {
                                    if status.success() {
                                        job_store
                                            .update_status(&job_id_clone, JobStatus::Done, None)
                                            .await;
                                    } else {
                                        let err_msg = format!(
                                            "Process exited with status {:?}",
                                            status.code()
                                        );
                                        job_store
                                            .update_status(
                                                &job_id_clone,
                                                JobStatus::Error,
                                                Some(err_msg),
                                            )
                                            .await;
                                    }
                                }
                                if let Some(final_job) = job_store.get_job(&job_id_clone).await {
                                    job_store.append_to_history(&final_job).await;
                                }
                            }
                        }
                        Err(e) => {
                            job_store.unregister_pid(&job_id_clone).await;
                            job_store
                                .update_status(&job_id_clone, JobStatus::Error, Some(e.to_string()))
                                .await;
                        }
                    }
                }
                Err(e) => {
                    error!(job_id = %job_id_clone, error = %e, "Failed to spawn yt-dlp process");
                    job_store
                        .update_status(&job_id_clone, JobStatus::Error, Some(e.to_string()))
                        .await;
                }
            }
        });

        let result = json!({
            "job_id": job_id,
            "status": "queued",
            "url": url,
        });
        CallToolResult::json(&result).unwrap()
    }

    async fn tool_get_job_status(&self, params: Value) -> CallToolResult {
        let job_id = match params.get("job_id").and_then(Value::as_str) {
            Some(id) => id,
            None => return CallToolResult::error("Missing parameter 'job_id'"),
        };

        match self.job_store.get_job(job_id).await {
            Some(job) => CallToolResult::json(&job).unwrap(),
            None => CallToolResult::error(format!("Job '{}' not found", job_id)),
        }
    }

    async fn tool_cancel_job(&self, params: Value) -> CallToolResult {
        let job_id = match params.get("job_id").and_then(Value::as_str) {
            Some(id) => id,
            None => return CallToolResult::error("Missing parameter 'job_id'"),
        };

        match self.job_store.cancel_job(job_id).await {
            Ok(_) => {
                let res = json!({ "success": true, "job_id": job_id, "status": "cancelled" });
                CallToolResult::json(&res).unwrap()
            }
            Err(e) => CallToolResult::error(e),
        }
    }

    async fn tool_list_jobs(&self, params: Value) -> CallToolResult {
        let filter = params.get("status").and_then(Value::as_str);
        let jobs = self.job_store.list_jobs(filter).await;
        CallToolResult::json(&jobs).unwrap()
    }

    async fn tool_fetch_info(&self, params: Value) -> CallToolResult {
        let url = match params.get("url").and_then(Value::as_str) {
            Some(u) => u,
            None => return CallToolResult::error("Missing parameter 'url'"),
        };

        let ytdlp_path = match self.resolver.resolve_ytdlp() {
            Some(p) => p,
            None => return CallToolResult::error("yt-dlp binary not found"),
        };

        let mut cmd = Command::new(&ytdlp_path);
        cmd.args(["-j", "--no-playlist", "--no-warnings", url])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        match tokio::time::timeout(Duration::from_secs(30), cmd.output()).await {
            Ok(Ok(output)) => {
                if output.status.success() {
                    match serde_json::from_slice::<Value>(&output.stdout) {
                        Ok(json_val) => CallToolResult::json(&json_val).unwrap(),
                        Err(e) => CallToolResult::error(format!(
                            "Failed to parse yt-dlp JSON output: {}",
                            e
                        )),
                    }
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    CallToolResult::error(format!("yt-dlp error: {}", stderr))
                }
            }
            Ok(Err(e)) => CallToolResult::error(format!("Failed to execute yt-dlp: {}", e)),
            Err(_) => CallToolResult::error("Timed out after 30 seconds fetching metadata"),
        }
    }

    async fn tool_fetch_formats(&self, params: Value) -> CallToolResult {
        let url = match params.get("url").and_then(Value::as_str) {
            Some(u) => u,
            None => return CallToolResult::error("Missing parameter 'url'"),
        };

        let ytdlp_path = match self.resolver.resolve_ytdlp() {
            Some(p) => p,
            None => return CallToolResult::error("yt-dlp binary not found"),
        };

        let mut cmd = Command::new(&ytdlp_path);
        cmd.args(["-F", "--no-warnings", url])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        match tokio::time::timeout(Duration::from_secs(30), cmd.output()).await {
            Ok(Ok(output)) => {
                if output.status.success() {
                    let raw_table = String::from_utf8_lossy(&output.stdout).to_string();
                    let formats = parse_formats_table(&raw_table);
                    let res = json!({
                        "raw_table": raw_table,
                        "formats": formats
                    });
                    CallToolResult::json(&res).unwrap()
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    CallToolResult::error(format!("yt-dlp error: {}", stderr))
                }
            }
            Ok(Err(e)) => CallToolResult::error(format!("Failed to execute yt-dlp: {}", e)),
            Err(_) => CallToolResult::error("Timed out after 30 seconds fetching formats"),
        }
    }

    async fn tool_fetch_thumbnails(&self, params: Value) -> CallToolResult {
        let url = match params.get("url").and_then(Value::as_str) {
            Some(u) => u,
            None => return CallToolResult::error("Missing parameter 'url'"),
        };

        let ytdlp_path = match self.resolver.resolve_ytdlp() {
            Some(p) => p,
            None => return CallToolResult::error("yt-dlp binary not found"),
        };

        let mut cmd = Command::new(&ytdlp_path);
        cmd.args(["-j", "--no-playlist", "--no-warnings", url])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        match tokio::time::timeout(Duration::from_secs(30), cmd.output()).await {
            Ok(Ok(output)) => {
                if output.status.success() {
                    if let Ok(info) = serde_json::from_slice::<Value>(&output.stdout) {
                        let thumbnails =
                            info.get("thumbnails").cloned().unwrap_or_else(|| json!([]));
                        CallToolResult::json(&thumbnails).unwrap()
                    } else {
                        CallToolResult::error("Failed to parse metadata JSON")
                    }
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    CallToolResult::error(format!("yt-dlp error: {}", stderr))
                }
            }
            Ok(Err(e)) => CallToolResult::error(format!("Failed to execute yt-dlp: {}", e)),
            Err(_) => CallToolResult::error("Timed out after 30 seconds fetching thumbnails"),
        }
    }

    async fn tool_search(&self, params: Value) -> CallToolResult {
        let query = match params.get("query").and_then(Value::as_str) {
            Some(q) => q,
            None => return CallToolResult::error("Missing parameter 'query'"),
        };

        let engine = params
            .get("engine")
            .and_then(Value::as_str)
            .unwrap_or("youtube");
        let count = params.get("count").and_then(Value::as_u64).unwrap_or(5);

        let prefix = match engine {
            "ytmusic" => "ytmsearch",
            "soundcloud" => "scsearch",
            _ => "ytsearch",
        };

        let search_arg = format!("{}{}:{}", prefix, count, query);

        let ytdlp_path = match self.resolver.resolve_ytdlp() {
            Some(p) => p,
            None => return CallToolResult::error("yt-dlp binary not found"),
        };

        let mut cmd = Command::new(&ytdlp_path);
        cmd.args(["-j", "--flat-playlist", "--no-warnings", &search_arg])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        match tokio::time::timeout(Duration::from_secs(30), cmd.output()).await {
            Ok(Ok(output)) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let mut results = Vec::new();
                for line in stdout.lines() {
                    if let Ok(item) = serde_json::from_str::<Value>(line) {
                        results.push(json!({
                            "id": item.get("id"),
                            "title": item.get("title"),
                            "url": item.get("url").or_else(|| item.get("webpage_url")),
                            "duration": item.get("duration"),
                            "uploader": item.get("uploader"),
                            "thumbnail": item.get("thumbnail").or_else(|| item.get("thumbnails")),
                        }));
                    }
                }
                CallToolResult::json(&results).unwrap()
            }
            Ok(Err(e)) => CallToolResult::error(format!("Failed to execute search: {}", e)),
            Err(_) => CallToolResult::error("Search timed out after 30 seconds"),
        }
    }

    async fn tool_check_dependency(&self, params: Value) -> CallToolResult {
        let name = match params.get("name").and_then(Value::as_str) {
            Some(n) => n,
            None => return CallToolResult::error("Missing parameter 'name'"),
        };

        let normalized = name.to_lowercase();
        let resolved = self.resolver.resolve_tool(&normalized);

        match resolved {
            Some(bin_path) => {
                let arg = if normalized == "ffmpeg" || normalized == "ffprobe" {
                    "-version"
                } else {
                    "--version"
                };

                let mut cmd = Command::new(&bin_path);
                cmd.arg(arg).stdout(Stdio::piped()).stderr(Stdio::piped());

                #[cfg(windows)]
                {
                    cmd.creation_flags(0x08000000);
                }

                let (version, installed) =
                    match tokio::time::timeout(Duration::from_secs(5), cmd.output()).await {
                        Ok(Ok(out)) => {
                            let text = if !out.stdout.is_empty() {
                                String::from_utf8_lossy(&out.stdout)
                            } else {
                                String::from_utf8_lossy(&out.stderr)
                            };
                            let first_line = text.lines().next().unwrap_or("").trim().to_string();
                            (first_line, true)
                        }
                        _ => ("Unknown".to_string(), true),
                    };

                let res = json!({
                    "name": name,
                    "installed": installed,
                    "version": version,
                    "path": bin_path.to_string_lossy(),
                });
                CallToolResult::json(&res).unwrap()
            }
            None => {
                let res = json!({
                    "name": name,
                    "installed": false,
                    "version": Value::Null,
                    "path": Value::Null,
                });
                CallToolResult::json(&res).unwrap()
            }
        }
    }

    pub async fn get_extractors_list(&self) -> Result<Vec<String>, String> {
        {
            let cache = self.cached_extractors.read().await;
            if let Some((instant, ref list)) = *cache {
                if instant.elapsed() < Duration::from_secs(3600) {
                    return Ok(list.clone());
                }
            }
        }

        let ytdlp_path = self
            .resolver
            .resolve_ytdlp()
            .ok_or_else(|| "yt-dlp binary not found".to_string())?;

        let mut cmd = Command::new(&ytdlp_path);
        cmd.arg("--list-extractors")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        let output = cmd.output().await.map_err(|e| e.to_string())?;
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            let list: Vec<String> = text
                .lines()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();

            let mut cache = self.cached_extractors.write().await;
            *cache = Some((std::time::Instant::now(), list.clone()));
            Ok(list)
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    async fn tool_get_supported_sites(&self, params: Value) -> CallToolResult {
        let search = params.get("search").and_then(Value::as_str);
        let page = params.get("page").and_then(Value::as_u64).unwrap_or(0) as usize;
        let per_page = params.get("per_page").and_then(Value::as_u64).unwrap_or(50) as usize;

        let extractors = match self.get_extractors_list().await {
            Ok(list) => list,
            Err(e) => {
                return CallToolResult::error(format!("Failed to retrieve extractors: {}", e))
            }
        };

        let filtered: Vec<String> = if let Some(q) = search {
            let lower = q.to_lowercase();
            extractors
                .into_iter()
                .filter(|s| s.to_lowercase().contains(&lower))
                .collect()
        } else {
            extractors
        };

        let total = filtered.len();
        let start = (page * per_page).min(total);
        let end = ((page + 1) * per_page).min(total);
        let slice = &filtered[start..end];

        let res = json!({
            "total": total,
            "page": page,
            "per_page": per_page,
            "sites": slice,
        });
        CallToolResult::json(&res).unwrap()
    }

    async fn tool_build_command(&self, params: Value) -> CallToolResult {
        let (url, args) = match self.build_ytdlp_args(&params) {
            Ok(res) => res,
            Err(e) => return CallToolResult::error(e),
        };

        let mut full_cmd_parts = vec!["yt-dlp".to_string()];
        full_cmd_parts.extend(args.iter().cloned());

        let res = json!({
            "command": "yt-dlp",
            "args": args,
            "full_command": full_cmd_parts.join(" "),
            "url": url,
        });
        CallToolResult::json(&res).unwrap()
    }

    async fn tool_update_ytdlp(&self) -> CallToolResult {
        let ytdlp_path = match self.resolver.resolve_ytdlp() {
            Some(p) => p,
            None => return CallToolResult::error("yt-dlp binary not found"),
        };

        let mut cmd = Command::new(&ytdlp_path);
        cmd.arg("-U").stdout(Stdio::piped()).stderr(Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        match cmd.output().await {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let combined = if stderr.is_empty() {
                    stdout
                } else {
                    format!("{}\n{}", stdout, stderr)
                };

                let res = json!({
                    "success": output.status.success(),
                    "output": combined.trim(),
                });
                CallToolResult::json(&res).unwrap()
            }
            Err(e) => CallToolResult::error(format!("Failed to run update: {}", e)),
        }
    }
}

fn parse_formats_table(table: &str) -> Vec<Value> {
    let mut formats = Vec::new();
    let mut header_seen = false;

    for line in table.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("ID") || trimmed.contains("EXT") && trimmed.contains("RESOLUTION") {
            header_seen = true;
            continue;
        }
        if !header_seen || trimmed.starts_with('-') || trimmed.starts_with('─') || trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with("WARNING:")
            || trimmed.starts_with("ERROR:")
            || trimmed.starts_with('[')
            || trimmed.starts_with("Note:")
        {
            continue;
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() >= 3 {
            let format_id = parts[0];
            if format_id.ends_with(':') || format_id.starts_with('[') || format_id.starts_with('(') {
                continue;
            }
            let extension = parts[1];
            let resolution = parts[2];
            let rest = parts[3..].join(" ");
            formats.push(json!({
                "format_id": format_id,
                "extension": extension,
                "resolution": resolution,
                "note": rest,
            }));
        }
    }

    formats
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_tools_count() {
        let resolver = BinaryResolver::new(None, None);
        let store = JobStore::new();
        let mgr = ToolManager::new(resolver, store);
        let tools = mgr.list_tools();
        assert_eq!(tools.len(), 12);
    }

    #[tokio::test]
    async fn test_build_command() {
        let resolver = BinaryResolver::new(None, None);
        let store = JobStore::new();
        let mgr = ToolManager::new(resolver, store);
        let res = mgr
            .call_tool(
                "build_command",
                json!({
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "format": "mp3",
                    "extract_audio": true,
                    "audio_format": "mp3"
                }),
            )
            .await;

        assert!(!res.is_error);
        let text = &res.content[0].text;
        assert!(text.contains("yt-dlp"));
        assert!(text.contains("-x"));
        assert!(text.contains("--audio-format"));
        assert!(text.contains("mp3"));
    }

    #[tokio::test]
    async fn test_format_table_parser() {
        let sample = "
[info] Available formats for dQw4w9WgXcQ:
ID  EXT   RESOLUTION FPS │   FILESIZE   TBR PROTO │ VCODEC        VBR ACODEC      ABR
─────────────────────────────────────────────────────────────────────────────────────
sb3 mhtml 48x27        0 │                  mhtml │ images                               storyboard
sb2 mhtml 80x45        0 │                  mhtml │ images                               storyboard
139 m4a   audio only     │    1.30MiB   49k https │ audio only        mp4a.40.5   49k [en]
140 m4a   audio only     │    3.45MiB  130k https │ audio only        mp4a.40.2  130k [en]
";
        let parsed = parse_formats_table(sample);
        assert_eq!(parsed.len(), 4);
        assert_eq!(parsed[2]["format_id"], "139");
        assert_eq!(parsed[2]["extension"], "m4a");
        assert_eq!(parsed[2]["resolution"], "audio");
    }
}
