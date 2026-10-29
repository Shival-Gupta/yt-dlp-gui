"""
Integration test script for ytdeck-mcp stdio JSON-RPC transport.
Sends requests over stdin, validates newline-delimited responses on stdout.
"""

import json
import os
import subprocess
import sys


def find_ytdeck_binary():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    candidates = [
        os.path.join(root, "target", "debug", "ytdeck-mcp.exe"),
        os.path.join(root, "target", "release", "ytdeck-mcp.exe"),
        os.path.join(root, "target", "debug", "ytdeck-mcp"),
        os.path.join(root, "target", "release", "ytdeck-mcp"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def main():
    binary = find_ytdeck_binary()
    if not binary:
        print("ytdeck-mcp binary not found yet in target/debug or target/release.")
        print("Please build first: cargo build -p ytdeck-mcp")
        return 1

    print(f"Testing binary: {binary}")
    proc = subprocess.Popen(
        [binary, "--transport", "stdio"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    def send_and_recv(req_dict):
        line = json.dumps(req_dict) + "\n"
        proc.stdin.write(line)
        proc.stdin.flush()
        resp_line = proc.stdout.readline()
        if not resp_line:
            err = proc.stderr.read()
            raise RuntimeError(f"Server closed stdout without responding. Stderr: {err}")
        return json.loads(resp_line)

    try:
        # 1. Initialize
        print("1. Sending initialize request...")
        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test-client", "version": "1.0.0"},
            },
        }
        init_resp = send_and_recv(init_req)
        assert init_resp.get("id") == 1
        res = init_resp["result"]
        assert res["serverInfo"]["name"] == "ytdeck-mcp"
        print("   [PASS] Initialize succeeded:", res["serverInfo"])

        # 2. Tools list
        print("2. Listing tools...")
        tools_req = {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}
        tools_resp = send_and_recv(tools_req)
        tools = tools_resp["result"]["tools"]
        print(f"   [PASS] Received {len(tools)} tools (expected 12)")
        assert len(tools) == 12, f"Expected 12 tools, got {len(tools)}"

        # 3. Resources list
        print("3. Listing resources...")
        res_req = {"jsonrpc": "2.0", "id": 3, "method": "resources/list"}
        res_resp = send_and_recv(res_req)
        resources = res_resp["result"]["resources"]
        print(f"   [PASS] Received {len(resources)} resources (expected 4)")
        assert len(resources) == 4, f"Expected 4 resources, got {len(resources)}"

        # 4. Dry-run build_command tool
        print("4. Testing build_command tool...")
        build_req = {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "build_command",
                "arguments": {
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "format": "mp3",
                    "extract_audio": True,
                },
            },
        }
        build_resp = send_and_recv(build_req)
        assert not build_resp["result"].get("isError", False)
        text_content = build_resp["result"]["content"][0]["text"]
        parsed = json.loads(text_content)
        assert parsed["command"] == "yt-dlp"
        assert "-x" in parsed["args"]
        print("   [PASS] build_command succeeded:", parsed["full_command"])

        # 5. Check dependency
        print("5. Testing check_dependency tool...")
        dep_req = {
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {
                "name": "check_dependency",
                "arguments": {"name": "ytdlp"},
            },
        }
        dep_resp = send_and_recv(dep_req)
        assert not dep_resp["result"].get("isError", False)
        dep_info = json.loads(dep_resp["result"]["content"][0]["text"])
        print(f"   [PASS] check_dependency response: installed={dep_info.get('installed')}, path={dep_info.get('path')}")

        print("\nAll integration checks passed successfully!")
        return 0

    finally:
        proc.stdin.close()
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    sys.exit(main())
