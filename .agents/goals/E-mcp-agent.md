# Subagent E — MCP Agent

## Mission
Build `ytdeck-mcp` — a standalone Rust binary implementing the Model Context Protocol. AI agents (Claude, Antigravity, Codex, Cursor, etc.) use this to programmatically control yt-dlp downloads without needing the GUI open. It must work completely independently of the GUI app.

## Context
- **Repo:** `d:\Projects\yt-ig-dowloader\yt-dlp-gui`
- **Crate location:** `ytdeck-mcp/` (new Cargo workspace member)
- **Depends on:** Subagent A (Foundation) — yt-dlp sidecar logic, Rust patterns
- **Runs in parallel with:** Subagents B and C
- **Protocol:** Model Context Protocol (MCP) — JSON-RPC 2.0

## MCP Protocol Reference
MCP spec: https://modelcontextprotocol.io/specification
- Transport 1 (primary): **stdio** — reads JSON-RPC from stdin, writes to stdout
- Transport 2 (secondary): **HTTP SSE** — GET /sse for events stream, POST /message for requests
- Port for HTTP: **7531** (default, configurable via `--port` flag)

## Architecture Decisions
- `ytdeck-mcp` is a **completely separate binary** — it locates `yt-dlp.exe` by:
  1. Checking `--ytdlp-path` CLI arg
  2. Checking `YTDECK_YTDLP_PATH` env var
  3. Checking same directory as the `ytdeck-mcp.exe` binary
  4. Checking system PATH
- Job state is in-process (HashMap) — no shared state with GUI app in v1
- In v2: GUI and MCP can share state via a named pipe or IPC socket
- The binary is also built as a separate release artifact

## Dependencies (Cargo.toml)
```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
anyhow = "1"
tracing = "0.1"
tracing-subscriber = "0.3"
clap = { version = "4", features = ["derive"] }
axum = "0.7"           # for HTTP SSE transport
tokio-stream = "0.1"
futures = "0.3"
```

## Ordered Task List (commit after each ✅)

### MCP-INIT-01: Create ytdeck-mcp crate
```powershell
cd d:\Projects\yt-ig-dowloader\yt-dlp-gui
cargo new ytdeck-mcp --name ytdeck-mcp
```
Add to workspace `Cargo.toml`:
```toml
[workspace]
members = ["src-tauri", "ytdeck-mcp"]
```
Commit: `chore: create ytdeck-mcp Rust crate as workspace member`

### MCP-INIT-02: CLI argument parsing
In `ytdeck-mcp/src/main.rs`:
```rust
#[derive(Parser)]
struct Args {
    #[arg(long, default_value = "stdio")]
    transport: String,         // "stdio" or "http"
    
    #[arg(long, default_value = "7531")]
    port: u16,                 // for HTTP transport
    
    #[arg(long)]
    ytdlp_path: Option<String>,
    
    #[arg(long)]
    ffmpeg_path: Option<String>,
    
    #[arg(long, default_value = "info")]
    log_level: String,         // trace/debug/info/warn/error
}
```
Commit: `chore: implement ytdeck-mcp CLI argument parsing`

### MCP-CORE-01: JSON-RPC 2.0 message types
Create `ytdeck-mcp/src/protocol.rs`:
```rust
// Request, Response, Error, Notification structs
// MCP-specific types: InitializeParams, InitializeResult
// ServerCapabilities, ServerInfo
// Tool, ToolInputSchema
// Resource, ResourceContents

#[derive(Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,  // "2.0"
    pub id: Option<Value>,
    pub method: String,
    pub params: Option<Value>,
}

#[derive(Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub id: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

#[derive(Serialize, Deserialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    pub data: Option<Value>,
}
```
Commit: `feat: implement MCP JSON-RPC 2.0 protocol types`

### MCP-CORE-02: stdio transport
Create `ytdeck-mcp/src/transport/stdio.rs`:
```rust
// Reads newline-delimited JSON from stdin
// Writes newline-delimited JSON to stdout
// Each message on its own line
// Handles EOF gracefully
// Never writes to stdout except JSON responses (use stderr for logs)

pub async fn run_stdio_transport(handler: Arc<McpHandler>) -> anyhow::Result<()> {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();
    // BufReader on stdin, line-by-line
    // Parse each line as JsonRpcRequest
    // dispatch to handler.handle_request()
    // serialize response and write to stdout
}
```
Commit: `feat: implement stdio JSON-RPC transport`

### MCP-CORE-03: HTTP SSE transport
Create `ytdeck-mcp/src/transport/http.rs`:
```rust
// GET /sse → SSE event stream (text/event-stream)
// POST /message → accepts JSON-RPC body, dispatches, returns 202 Accepted
//                 response is sent via SSE stream

// Use axum router:
// GET /sse → SSE handler
// POST /message → message handler
// GET /health → returns {"status":"ok","version":"1.0.0"}
```
Commit: `feat: implement HTTP SSE transport for MCP`

### MCP-CORE-04: MCP server initialization handler
Create `ytdeck-mcp/src/handler.rs`:
Handle the `initialize` method:
```json
// Response must include:
{
  "protocolVersion": "2024-11-05",
  "serverInfo": { "name": "ytdeck-mcp", "version": "1.0.0" },
  "capabilities": {
    "tools": {},
    "resources": { "subscribe": false, "listChanged": false }
  }
}
```
Handle `initialized` notification (no response needed).
Handle `ping` → respond with empty object `{}`.
Commit: `feat: implement MCP initialize and ping handlers`

### MCP-TOOLS-01: Tool list handler
Implement `tools/list` method. Returns all 12 tools with full JSON Schema for each parameter:

Tools:
1. `download` — download media from URL
2. `get_job_status` — get status of a download job
3. `cancel_job` — cancel a running job
4. `list_jobs` — list all jobs
5. `fetch_info` — get metadata for a URL
6. `fetch_formats` — get available download formats
7. `fetch_thumbnails` — get thumbnail URLs
8. `search` — search using yt-dlp search prefixes
9. `check_dependency` — check if a tool is installed
10. `get_supported_sites` — get list of supported extractors (paginated)
11. `build_command` — dry-run: returns the CLI args array without running
12. `update_ytdlp` — run `yt-dlp -U` to update yt-dlp

Commit: `feat: implement MCP tools/list handler with all 12 tool schemas`

### MCP-TOOLS-02: Tool — download
```json
// Tool schema:
{
  "name": "download",
  "description": "Download media from a URL using yt-dlp. Supports YouTube, Instagram, Twitter/X, TikTok, and 1750+ other sites.",
  "inputSchema": {
    "type": "object",
    "required": ["url"],
    "properties": {
      "url": { "type": "string", "description": "URL to download" },
      "format": { "type": "string", "description": "Format selector e.g. 'bv*+ba/b' or '137+140'" },
      "output_dir": { "type": "string", "description": "Output directory path" },
      "output_template": { "type": "string", "description": "Filename template e.g. '%(title)s.%(ext)s'" },
      "extract_audio": { "type": "boolean" },
      "audio_format": { "type": "string", "enum": ["mp3","m4a","flac","wav","opus","aac","vorbis"] },
      "write_subs": { "type": "boolean" },
      "write_thumbnail": { "type": "boolean" },
      "embed_metadata": { "type": "boolean" },
      "cookies_from_browser": { "type": "string", "description": "Browser name to extract cookies from: chrome, firefox, etc." },
      "extra_args": { "type": "array", "items": {"type":"string"}, "description": "Additional raw yt-dlp arguments" }
    }
  }
}
```
Implementation in `ytdeck-mcp/src/tools/download.rs`:
- Spawn yt-dlp with given args
- Store process in `JobStore` (HashMap<String, JobHandle>)
- Return `{ "job_id": "<uuid>", "status": "queued" }`
Commit: `feat: implement MCP download tool`

### MCP-TOOLS-03: Tool — get_job_status
```rust
// Reads from JobStore
// Returns:
// { "job_id": "...", "status": "downloading|done|error|cancelled",
//   "progress": 45.2, "speed": "2.4 MB/s", "eta": "0:23",
//   "output_path": "/path/to/file", "error": null }
```
Commit: `feat: implement MCP get_job_status tool`

### MCP-TOOLS-04: Tool — cancel_job
```rust
// Finds process in JobStore by job_id
// Kills the process (SIGTERM then SIGKILL after 2s on Windows: TerminateProcess)
// Updates job status to "cancelled"
// Returns { "success": true }
```
Commit: `feat: implement MCP cancel_job tool`

### MCP-TOOLS-05: Tool — list_jobs
```rust
// Returns array of all job status objects
// Optional filter param: status = "active|done|error|all" (default: "all")
```
Commit: `feat: implement MCP list_jobs tool`

### MCP-TOOLS-06: Tool — fetch_info
```rust
// Runs: yt-dlp -j --no-playlist <url>
// Returns the full JSON info object parsed as serde_json::Value
// --no-warnings to suppress noise
// Timeout: 30 seconds
```
Commit: `feat: implement MCP fetch_info tool`

### MCP-TOOLS-07: Tool — fetch_formats
```rust
// Runs: yt-dlp -F --no-warnings <url>
// Returns: { "raw_table": "...", "formats": [ parsed format objects ] }
// Parse the -F text table into structured format objects
```
Commit: `feat: implement MCP fetch_formats tool`

### MCP-TOOLS-08: Tool — fetch_thumbnails
```rust
// Runs: yt-dlp -j --no-playlist <url>, extracts thumbnails array
// Returns: [ { "id": "...", "url": "...", "width": N, "height": N, "resolution": "..." } ]
```
Commit: `feat: implement MCP fetch_thumbnails tool`

### MCP-TOOLS-09: Tool — search
```rust
// Params: { "query": "...", "engine": "youtube|ytmusic|soundcloud|...", "count": 5 }
// Builds search URL: "ytsearch5:query" or "ytmsearch3:query" etc.
// Runs: yt-dlp -j --flat-playlist "ytsearch5:<query>"
// Returns array of result info objects (id, title, url, duration, uploader, thumbnail)
```
Commit: `feat: implement MCP search tool`

### MCP-TOOLS-10: Tool — check_dependency
```rust
// Params: { "name": "ytdlp|ffmpeg|ffprobe|deno|node|aria2c|atomicparsley" }
// For each: tries to run `<name> --version` and captures output
// Returns: { "installed": true/false, "version": "...", "path": "..." }
```
Commit: `feat: implement MCP check_dependency tool`

### MCP-TOOLS-11: Tool — get_supported_sites
```rust
// Params: { "search": "instagram", "page": 0, "per_page": 50 }
// Runs: yt-dlp --list-extractors
// Parses output into list of extractor names
// Filters by search string if provided
// Returns: { "total": 1754, "page": 0, "sites": [...] }
```
Commit: `feat: implement MCP get_supported_sites tool`

### MCP-TOOLS-12: Tool — build_command
```rust
// Same params as download tool
// Returns: { "command": "yt-dlp", "args": ["...", "..."], "full_command": "yt-dlp --format bv*+ba/b ..." }
// Does NOT run anything — dry-run only
```
Commit: `feat: implement MCP build_command dry-run tool`

### MCP-RESOURCES-01: Resources list handler
Implement `resources/list` method:
```json
[
  { "uri": "ytdeck://queue", "name": "Download Queue", "description": "All current and pending download jobs", "mimeType": "application/json" },
  { "uri": "ytdeck://history", "name": "Download History", "description": "Completed download history (last 500 entries)", "mimeType": "application/json" },
  { "uri": "ytdeck://settings", "name": "App Settings", "description": "Current ytdeck-mcp settings", "mimeType": "application/json" },
  { "uri": "ytdeck://supported-sites", "name": "Supported Sites", "description": "All 1750+ supported extractors", "mimeType": "application/json" }
]
```
Commit: `feat: implement MCP resources/list handler`

### MCP-RESOURCES-02: Resource read handlers
Implement `resources/read` for each URI:
- `ytdeck://queue` → serialize current `JobStore` to JSON
- `ytdeck://history` → read `history.json` from AppData (or return `[]` if not accessible without GUI)
- `ytdeck://settings` → return MCP server config (ytdlp path, ffmpeg path, defaults)
- `ytdeck://supported-sites` → run `yt-dlp --list-extractors`, cache result in memory for 1 hour

Commit: `feat: implement MCP resource read handlers`

### MCP-TEST-01: Integration test script
Create `ytdeck-mcp/tests/integration.py` (Python, not Rust — easier for testing):
```python
# Start ytdeck-mcp as subprocess
# Send initialize request via stdin
# Receive initialize response via stdout
# Call tools/list — verify all 12 tools present
# Call check_dependency { "name": "ytdlp" } — verify response
# Call build_command { "url": "https://youtube.com/watch?v=test", "format": "mp3" }
# Call fetch_info with a real YouTube URL
# Verify clean exit
```
Commit: `test: add integration test script for MCP stdio protocol`

### MCP-TEST-02: Test with Claude Desktop (manual)
Add `ytdeck-mcp` to Claude Desktop config:
```json
// %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "ytdeck": {
      "command": "path/to/ytdeck-mcp.exe",
      "args": ["--transport", "stdio"]
    }
  }
}
```
Verify in Claude Desktop:
1. "What tools does ytdeck have?" → lists all 12 tools
2. "Check if ffmpeg is installed" → calls check_dependency
3. "Download this YouTube video: [URL]" → calls download, returns job_id
4. "What's the status of job [job_id]?" → calls get_job_status

Document results in `ytdeck-mcp/TESTING.md`.
Commit: `test: document manual MCP integration test with Claude Desktop`

## Definition of Done
- [ ] `ytdeck-mcp.exe` compiles and runs standalone
- [ ] stdio transport: reads/writes valid JSON-RPC 2.0
- [ ] HTTP SSE transport: GET /sse + POST /message work
- [ ] All 12 tools implemented with correct JSON Schema
- [ ] All 4 resources implemented
- [ ] `initialize` / `ping` / `tools/list` / `resources/list` work
- [ ] Integration test script passes
- [ ] Manual test with Claude Desktop documented
- [ ] All commits pushed to `main`
