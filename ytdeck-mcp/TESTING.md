# Testing Documentation: ytdeck-mcp

## 1. Automated Integration Tests

### Running Rust Integration Tests
From the workspace root (`d:\Projects\yt-ig-dowloader\yt-dlp-gui`):
```powershell
cargo test -p ytdeck-mcp
```
This tests:
- MCP JSON-RPC protocol compliance (`initialize`, `ping`, unknown method error codes).
- Tool discovery (`tools/list` returns all 12 tools).
- Resource discovery (`resources/list` returns all 4 resources).
- Tool execution (`build_command`, `check_dependency`, `download`, `get_job_status`, `cancel_job`).
- Resource reads (`ytdeck://settings`, `ytdeck://queue`, `ytdeck://history`, `ytdeck://supported-sites`).
- 4-level binary resolution logic.
- Process tree cancellation.

### Running Python stdio Integration Script
```powershell
python ytdeck-mcp/tests/integration.py
```
This spawns `ytdeck-mcp.exe` with `--transport stdio`, performs a handshake over stdin/stdout, and tests tools/list, resources/list, check_dependency, and build_command.

---

## 2. Manual Integration with Claude Desktop

### Configuration
Edit `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ytdeck": {
      "command": "d:\\Projects\\yt-ig-dowloader\\yt-dlp-gui\\target\\release\\ytdeck-mcp.exe",
      "args": ["--transport", "stdio"]
    }
  }
}
```
Or run `installer/resources/patch-mcp-configs.ps1` to automatically register it:
```powershell
powershell -ExecutionPolicy Bypass -File .\installer\resources\patch-mcp-configs.ps1
```

### Manual Verification Prompts
1. **Tool Roster Check**:
   - Prompt: *"What tools does the ytdeck MCP server have?"*
   - Expected Result: Claude lists all 12 tools (`download`, `get_job_status`, `cancel_job`, `list_jobs`, `fetch_info`, `fetch_formats`, `fetch_thumbnails`, `search`, `check_dependency`, `get_supported_sites`, `build_command`, `update_ytdlp`).
2. **Dependency Check**:
   - Prompt: *"Check if yt-dlp and ffmpeg are installed via ytdeck."*
   - Expected Result: Claude invokes `check_dependency` with `{"name": "ytdlp"}` and `{"name": "ffmpeg"}` and displays installed status, version, and binary path.
3. **Dry-Run Command Reconstruct**:
   - Prompt: *"Build the command to download audio from this URL: https://www.youtube.com/watch?v=aqz-KE-bpKQ in MP3 format."*
   - Expected Result: Claude invokes `build_command` and returns `{ "command": "yt-dlp", "args": ["-f", "mp3", "-x", "--audio-format", "mp3", ...] }`.
4. **Live Download**:
   - Prompt: *"Download this video: https://www.youtube.com/watch?v=aqz-KE-bpKQ"*
   - Expected Result: Claude invokes `download` tool, receives `job_id`, then calls `get_job_status` to monitor download percentage and completion.

---

## 3. Manual Integration with HTTP SSE Mode

Run server in HTTP mode:
```powershell
.\target\release\ytdeck-mcp.exe --transport http --port 7531
```

### Health Check
```powershell
curl http://127.0.0.1:7531/health
# Output: {"name":"ytdeck-mcp","status":"ok","version":"1.0.0"}
```

### SSE Stream & Message Handling
Connect to `http://127.0.0.1:7531/sse` and post JSON-RPC 2.0 requests to `http://127.0.0.1:7531/message`.
