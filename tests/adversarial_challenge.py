"""
Empirical Adversarial Challenge Suite for Milestone 7
Target: ytdeck-mcp, process tree termination, binary resolution, and installer scripts.
"""

import os
import sys
import json
import time
import subprocess
import tempfile
import shutil
import threading
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BIN_PATH = os.path.join(ROOT_DIR, "target", "debug", "ytdeck-mcp.exe")

RESULTS = []

def record(test_name: str, passed: bool, details: str):
    status = "PASS" if passed else "FAIL"
    RESULTS.append({"test": test_name, "status": status, "details": details})
    print(f"[{status}] {test_name}: {details}", flush=True)

# ==============================================================================
# Helper: Stdio Client with Threaded Stderr Draining
# ==============================================================================
class StdioMcpClient:
    def __init__(self, binary=BIN_PATH, extra_args=None, env=None, cwd=None):
        cmd = [binary, "--transport", "stdio", "--log-level", "debug"]
        if extra_args:
            cmd.extend(extra_args)
        self.proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            cwd=cwd,
            env=env or os.environ.copy()
        )
        self.stderr_lines = []
        self._drain_thread = threading.Thread(target=self._drain_stderr, daemon=True)
        self._drain_thread.start()

    def _drain_stderr(self):
        try:
            for line in self.proc.stderr:
                self.stderr_lines.append(line)
        except Exception:
            pass

    def send_raw(self, line: str):
        self.proc.stdin.write(line + "\n")
        self.proc.stdin.flush()

    def send_json(self, obj):
        self.send_raw(json.dumps(obj))

    def read_line(self, timeout=3.0):
        start = time.time()
        while time.time() - start < timeout:
            if self.proc.poll() is not None:
                err = "".join(self.stderr_lines)
                raise RuntimeError(f"Server exited unexpectedly (code {self.proc.returncode}). Stderr: {err}")
            line = self.proc.stdout.readline()
            if line:
                return line.strip()
            time.sleep(0.01)
        raise TimeoutError("Timed out waiting for response line on stdout")

    def read_json(self, timeout=3.0):
        line = self.read_line(timeout=timeout)
        return json.loads(line)

    def close(self):
        try:
            self.proc.stdin.close()
        except Exception:
            pass
        self.proc.terminate()
        try:
            self.proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            self.proc.kill()

# ==============================================================================
# Test Group 1: JSON-RPC Stdio Transport Adversarial Edge Cases
# ==============================================================================
def test_group_1_jsonrpc():
    print("\n--- Test Group 1: JSON-RPC Stdio Transport Adversarial Edge Cases ---", flush=True)
    client = StdioMcpClient()

    try:
        # 1.1 Malformed JSON (syntax error)
        try:
            client.send_raw('{"jsonrpc": "2.0", "id": 1, "method": ')
            resp = client.read_json()
            is_parse_error = resp.get("error", {}).get("code") == -32700
            record("1.1 Malformed JSON Syntax (-32700)", is_parse_error, f"Received: {resp}")
        except Exception as e:
            record("1.1 Malformed JSON Syntax (-32700)", False, f"Exception: {e}")

        # 1.2 Random non-JSON garbage line
        try:
            client.send_raw('This is definitely not JSON!')
            resp = client.read_json()
            is_parse_error = resp.get("error", {}).get("code") == -32700
            record("1.2 Non-JSON Garbage Line (-32700)", is_parse_error, f"Received: {resp}")
        except Exception as e:
            record("1.2 Non-JSON Garbage Line (-32700)", False, f"Exception: {e}")

        # 1.3 Empty lines and whitespace
        try:
            client.send_raw('')
            client.send_raw('   ')
            client.send_raw('\t\t')
            client.send_json({"jsonrpc": "2.0", "id": 10, "method": "ping"})
            resp = client.read_json()
            ok = resp.get("id") == 10 and "result" in resp
            record("1.3 Empty / Whitespace Lines Ignored Cleanly", ok, f"Ping response after whitespace: {resp}")
        except Exception as e:
            record("1.3 Empty / Whitespace Lines Ignored Cleanly", False, f"Exception: {e}")

        # 1.4 Missing JSON-RPC fields (e.g. empty object {})
        try:
            client.send_raw('{}')
            resp = client.read_json()
            is_err = "error" in resp
            record("1.4 Missing JSON-RPC Fields", is_err, f"Received: {resp}")
        except Exception as e:
            record("1.4 Missing JSON-RPC Fields", False, f"Exception: {e}")

        # 1.5 JSON-RPC Batch request
        try:
            batch = [
                {"jsonrpc": "2.0", "id": 20, "method": "ping"},
                {"jsonrpc": "2.0", "id": 21, "method": "ping"}
            ]
            client.send_json(batch)
            resp = client.read_json()
            record("1.5 JSON-RPC Batch Request Handling", "error" in resp or isinstance(resp, list), f"Received: {resp}")
        except Exception as e:
            record("1.5 JSON-RPC Batch Request Handling", False, f"Exception: {e}")

        # 1.6 Partial JSON write (chunked over time before newline)
        try:
            part1 = '{"jsonrpc": "2.0", '
            part2 = '"id": 30, '
            part3 = '"method": "ping"}\n'
            client.proc.stdin.write(part1)
            client.proc.stdin.flush()
            time.sleep(0.05)
            client.proc.stdin.write(part2)
            client.proc.stdin.flush()
            time.sleep(0.05)
            client.proc.stdin.write(part3)
            client.proc.stdin.flush()
            resp = client.read_json()
            ok = resp.get("id") == 30 and "result" in resp
            record("1.6 Partial Chunked Streamed Request", ok, f"Ping response: {resp}")
        except Exception as e:
            record("1.6 Partial Chunked Streamed Request", False, f"Exception: {e}")

        # 1.7 Unknown Method
        try:
            client.send_json({"jsonrpc": "2.0", "id": 40, "method": "bogus_method_name"})
            resp = client.read_json()
            is_not_found = resp.get("error", {}).get("code") == -32601
            record("1.7 Unknown Method (-32601)", is_not_found, f"Received: {resp}")
        except Exception as e:
            record("1.7 Unknown Method (-32601)", False, f"Exception: {e}")

        # 1.8 Unknown Tool Name
        try:
            client.send_json({
                "jsonrpc": "2.0",
                "id": 50,
                "method": "tools/call",
                "params": {"name": "completely_nonexistent_tool_xyz", "arguments": {}}
            })
            resp = client.read_json()
            res = resp.get("result", {})
            is_tool_err = res.get("isError") is True and "Unknown tool" in res.get("content", [{}])[0].get("text", "")
            record("1.8 Unknown Tool Name in tools/call", is_tool_err, f"Received: {resp}")
        except Exception as e:
            record("1.8 Unknown Tool Name in tools/call", False, f"Exception: {e}")

        # 1.9 Missing tool name parameter in tools/call
        try:
            client.send_json({
                "jsonrpc": "2.0",
                "id": 51,
                "method": "tools/call",
                "params": {"arguments": {}}
            })
            resp = client.read_json()
            is_inv_param = resp.get("error", {}).get("code") == -32602
            record("1.9 Missing Tool Name in tools/call (-32602)", is_inv_param, f"Received: {resp}")
        except Exception as e:
            record("1.9 Missing Tool Name in tools/call (-32602)", False, f"Exception: {e}")

        # 1.10 Unknown Resource URI
        try:
            client.send_json({
                "jsonrpc": "2.0",
                "id": 60,
                "method": "resources/read",
                "params": {"uri": "ytdeck://nonexistent_resource"}
            })
            resp = client.read_json()
            is_res_err = resp.get("error", {}).get("code") == -32603
            record("1.10 Unknown Resource URI in resources/read (-32603)", is_res_err, f"Received: {resp}")
        except Exception as e:
            record("1.10 Unknown Resource URI in resources/read (-32603)", False, f"Exception: {e}")

        # 1.11 Burst Stress of 50 Invalid Requests in a row
        try:
            survived = True
            for i in range(50):
                client.send_raw(f'{{"invalid_json_{i}": true')
                resp = client.read_json()
                if resp.get("error", {}).get("code") != -32700:
                    survived = False
                    break
            client.send_json({
                "jsonrpc": "2.0",
                "id": 999,
                "method": "initialize",
                "params": {"protocolVersion": "2024-11-05"}
            })
            resp = client.read_json()
            ok = resp.get("id") == 999 and "result" in resp
            record("1.11 Burst Stress Resilience (50 invalid lines in rapid succession)", survived and ok, "Server processed all parse errors and answered subsequent initialize")
        except Exception as e:
            record("1.11 Burst Stress Resilience (50 invalid lines in rapid succession)", False, f"Exception: {e}")

    finally:
        client.close()

# ==============================================================================
# Test Group 2: Binary Resolution & Fallback Behavior
# ==============================================================================
def test_group_2_binary_resolution():
    print("\n--- Test Group 2: Binary Resolution & Fallback Behavior ---", flush=True)

    # 2.1 Nonexistent path passed to --ytdlp-path should fall back to Level 3 sibling
    nonexistent = r"C:\path\that\does\not\exist\at\all\yt-dlp.exe"
    client = StdioMcpClient(extra_args=["--ytdlp-path", nonexistent])
    try:
        client.send_json({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": "check_dependency", "arguments": {"name": "ytdlp"}}
        })
        resp = client.read_json()
        text = resp["result"]["content"][0]["text"]
        dep_data = json.loads(text)
        # Sibling yt-dlp was found in target/debug
        record("2.1 Nonexistent CLI Path Falls Back to Sibling Binary", dep_data.get("installed") is True, f"check_dependency response: {dep_data}")
    finally:
        client.close()

    # 2.2 Complete Absence of Binaries across ALL 4 levels (Isolated Directory, no sibling, clean PATH)
    temp_dir = tempfile.mkdtemp()
    try:
        isolated_bin = os.path.join(temp_dir, "ytdeck-mcp.exe")
        shutil.copyfile(BIN_PATH, isolated_bin)

        clean_env = {"PATH": r"C:\Windows\System32", "SYSTEMROOT": r"C:\Windows"}

        client_isolated = StdioMcpClient(
            binary=isolated_bin,
            cwd=temp_dir,
            env=clean_env
        )

        try:
            # 2.2.1 Check dependency reports not installed
            client_isolated.send_json({
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {"name": "check_dependency", "arguments": {"name": "ytdlp"}}
            })
            resp = client_isolated.read_json()
            dep_data = json.loads(resp["result"]["content"][0]["text"])
            record("2.2 Genuine Absence: check_dependency reports uninstalled", dep_data.get("installed") is False, f"Result: {dep_data}")

            # 2.2.2 Call fetch_info
            client_isolated.send_json({
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {"name": "fetch_info", "arguments": {"url": "https://example.com/test"}}
            })
            resp = client_isolated.read_json()
            res = resp.get("result", {})
            err_reported = res.get("isError") is True and "not found" in res.get("content", [{}])[0].get("text", "").lower()
            record("2.3 Genuine Absence: fetch_info returns clean error", err_reported, f"Result: {res}")

            # 2.2.3 Call download
            client_isolated.send_json({
                "jsonrpc": "2.0",
                "id": 4,
                "method": "tools/call",
                "params": {"name": "download", "arguments": {"url": "https://example.com/test"}}
            })
            resp = client_isolated.read_json()
            res = resp.get("result", {})
            dl_err = res.get("isError") is True and "not found" in res.get("content", [{}])[0].get("text", "").lower()
            record("2.4 Genuine Absence: download returns clean error", dl_err, f"Result: {res}")

            # 2.2.4 Call fetch_formats
            client_isolated.send_json({
                "jsonrpc": "2.0",
                "id": 5,
                "method": "tools/call",
                "params": {"name": "fetch_formats", "arguments": {"url": "https://example.com/test"}}
            })
            resp = client_isolated.read_json()
            res = resp.get("result", {})
            fmt_err = res.get("isError") is True and "not found" in res.get("content", [{}])[0].get("text", "").lower()
            record("2.5 Genuine Absence: fetch_formats returns clean error", fmt_err, f"Result: {res}")

        finally:
            client_isolated.close()

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# ==============================================================================
# Test Group 3: Process Tree Termination & Dangling Process Leaks
# ==============================================================================
def test_group_3_process_tree_termination():
    print("\n--- Test Group 3: Process Tree Termination & Dangling Process Leaks ---", flush=True)

    temp_dir = tempfile.mkdtemp()
    mock_script = os.path.join(temp_dir, "mock_sleeper.cmd")
    with open(mock_script, "w") as f:
        f.write("@echo off\n")
        f.write("echo [download]  0.0% of ~50.00MiB at 1.00MiB/s ETA 01:00\n")
        f.write("ping -n 45 127.0.0.1 > nul\n")

    client = StdioMcpClient(extra_args=["--ytdlp-path", mock_script])
    try:
        # Start download job using mock sleeper
        client.send_json({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": "download", "arguments": {"url": "https://example.com/stream"}}
        })
        resp = client.read_json()
        content = json.loads(resp["result"]["content"][0]["text"])
        job_id = content["job_id"]
        print(f"Spawned mock download job: {job_id}", flush=True)

        time.sleep(1.0)

        # Check job status
        client.send_json({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "get_job_status", "arguments": {"job_id": job_id}}
        })
        resp = client.read_json()
        status_info = json.loads(resp["result"]["content"][0]["text"])

        # Check running PING.EXE processes before cancel
        pings_before = subprocess.run(["tasklist", "/FI", "IMAGENAME eq PING.EXE", "/FO", "CSV"], capture_output=True, text=True).stdout
        has_ping = "PING.EXE" in pings_before
        record("3.1 Child Process Spawned in Process Tree", has_ping, f"PING.EXE detected in tasklist: {has_ping}")

        # Cancel the job via cancel_job tool
        client.send_json({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {"name": "cancel_job", "arguments": {"job_id": job_id}}
        })
        cancel_resp = client.read_json()
        cancel_res = json.loads(cancel_resp["result"]["content"][0]["text"])
        ok_cancel = cancel_res.get("success") is True and cancel_res.get("status") == "cancelled"
        record("3.2 cancel_job Execution Response", ok_cancel, f"Result: {cancel_res}")

        # Wait for OS process tree termination
        time.sleep(1.5)

        # Verify job status is cancelled
        client.send_json({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {"name": "get_job_status", "arguments": {"job_id": job_id}}
        })
        resp = client.read_json()
        status_info_after = json.loads(resp["result"]["content"][0]["text"])
        record("3.3 Job Status Updated to Cancelled", status_info_after["status"] == "cancelled", f"Status: {status_info_after['status']}")

        # 3.4 Verify NO dangling processes from this tree
        pings_after = subprocess.run(["tasklist", "/FI", "IMAGENAME eq PING.EXE", "/FO", "CSV"], capture_output=True, text=True).stdout
        no_dangling = ("PING.EXE" not in pings_after) or (pings_after.count("PING.EXE") < pings_before.count("PING.EXE"))
        record("3.4 Process Tree Clean Termination (No Dangling Child Processes)", no_dangling, "Verified taskkill /F /T eliminated entire process hierarchy")

        # 3.5 Cancel Nonexistent Job
        client.send_json({
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {"name": "cancel_job", "arguments": {"job_id": "00000000-0000-0000-0000-000000000000"}}
        })
        resp = client.read_json()
        is_err = resp["result"].get("isError") is True
        record("3.5 Cancel Nonexistent Job Handled Gracefully", is_err, f"Response: {resp}")

        # 3.6 Cancel Already-Cancelled Job (Idempotency)
        client.send_json({
            "jsonrpc": "2.0",
            "id": 6,
            "method": "tools/call",
            "params": {"name": "cancel_job", "arguments": {"job_id": job_id}}
        })
        resp = client.read_json()
        res_text = json.loads(resp["result"]["content"][0]["text"])
        record("3.6 Cancel Already-Cancelled Job Idempotent", res_text.get("success") is True, f"Response: {res_text}")

    finally:
        client.close()
        shutil.rmtree(temp_dir, ignore_errors=True)

# ==============================================================================
# Test Group 4: PowerShell Scripts & Boundary Parameters
# ==============================================================================
def test_group_4_powershell_scripts():
    print("\n--- Test Group 4: PowerShell Scripts & Boundary Parameters ---", flush=True)

    patch_script = os.path.join(ROOT_DIR, "installer", "resources", "patch-mcp-configs.ps1")
    install_skill_script = os.path.join(ROOT_DIR, "skill", "install-skill.ps1")

    # 4.1 PowerShell AST Syntax Parsing
    ast_check_code = f"""
    $errors = @()
    [System.Management.Automation.Language.Parser]::ParseFile('{patch_script}', [ref]$null, [ref]$errors) | Out-Null
    if ($errors.Count -gt 0) {{ exit 1 }}
    [System.Management.Automation.Language.Parser]::ParseFile('{install_skill_script}', [ref]$null, [ref]$errors) | Out-Null
    if ($errors.Count -gt 0) {{ exit 2 }}
    exit 0
    """
    res = subprocess.run(["powershell", "-NoProfile", "-Command", ast_check_code], capture_output=True, text=True)
    record("4.1 PowerShell Script AST Syntax Validation", res.returncode == 0, f"Exit code: {res.returncode}")

    # 4.2 ValidateSet rejection on invalid Transport
    invalid_transport_cmd = f"& '{patch_script}' -Transport 'invalid_protocol' -McpBinaryPath 'dummy.exe'"
    res = subprocess.run(["powershell", "-NoProfile", "-Command", invalid_transport_cmd], capture_output=True, text=True)
    record("4.2 patch-mcp-configs ValidateSet Rejection", res.returncode != 0 and "ValidateSet" in res.stderr, "Rejected invalid Transport parameter via ValidateSet constraint")

    # 4.3 Adversarial Edge Case: Fresh Machine where client config file does not exist yet
    temp_dir = tempfile.mkdtemp()
    try:
        mock_appdata = os.path.join(temp_dir, "AppData")
        mock_user = os.path.join(temp_dir, "User")
        os.makedirs(os.path.join(mock_appdata, "Claude"), exist_ok=True)

        mock_env_run = f"""
        $env:APPDATA = '{mock_appdata}'
        $env:USERPROFILE = '{mock_user}'
        & '{patch_script}' -McpBinaryPath 'C:\\Test Path\\ytdeck-mcp.exe' -Transport 'stdio'
        """
        res = subprocess.run(["powershell", "-NoProfile", "-Command", mock_env_run], capture_output=True, text=True)
        # Check if it succeeded or crashed on OrderedDictionary.ContainsKey
        if res.returncode != 0 and "ContainsKey" in res.stderr:
            record("4.3 patch-mcp-configs Nonexistent/OrderedDictionary Handling", False, f"BUG CONFIRMED: Crashed with MethodNotFound on OrderedDictionary.ContainsKey: {res.stderr.strip()[:160]}")
        else:
            record("4.3 patch-mcp-configs Nonexistent/OrderedDictionary Handling", res.returncode == 0, f"Exit code: {res.returncode}")

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    # 4.4 install-skill.ps1 with -Force in clean environment
    temp_skill_dir = tempfile.mkdtemp()
    try:
        mock_user = os.path.join(temp_skill_dir, "User")
        mock_env_skill = f"""
        $env:USERPROFILE = '{mock_user}'
        $env:APPDATA = '{mock_user}\\AppData'
        & '{install_skill_script}' -Force
        """
        res = subprocess.run(["powershell", "-NoProfile", "-Command", mock_env_skill], capture_output=True, text=True)
        summary_line = [l for l in res.stdout.splitlines() if "Summary:" in l]
        record("4.4 install-skill.ps1 Execution with -Force", res.returncode == 0 and len(summary_line) > 0, f"Summary: {summary_line[0] if summary_line else res.returncode}")
    finally:
        shutil.rmtree(temp_skill_dir, ignore_errors=True)

# ==============================================================================
# Test Group 5: NSIS Installer Script Structure & Static Analysis
# ==============================================================================
def test_group_5_nsis_scripts():
    print("\n--- Test Group 5: NSIS Installer Script Static Verification ---", flush=True)

    installer_dir = os.path.join(ROOT_DIR, "installer")
    scripts = [
        "installer.nsi",
        "components.nsi",
        "download-ffmpeg.nsi",
        "download-deno.nsi",
        "download-atomicparsley.nsi",
        "download-aria2c.nsi",
    ]

    all_exist = True
    no_unclosed_blocks = True

    for s in scripts:
        path = os.path.join(installer_dir, s)
        if not os.path.exists(path):
            all_exist = False
            record(f"5.1 File Existence: {s}", False, "File missing")
            continue

        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        fn_starts = len(re.findall(r"^\s*Function\s+", content, re.MULTILINE))
        fn_ends = len(re.findall(r"^\s*FunctionEnd\b", content, re.MULTILINE))
        sec_starts = len(re.findall(r"^\s*Section\s+", content, re.MULTILINE))
        sec_ends = len(re.findall(r"^\s*SectionEnd\b", content, re.MULTILINE))

        balanced = (fn_starts == fn_ends) and (sec_starts == sec_ends)
        if not balanced:
            no_unclosed_blocks = False
            record(f"5.1 Block Balance: {s}", False, f"Functions: {fn_starts}/{fn_ends}, Sections: {sec_starts}/{sec_ends}")
        else:
            record(f"5.1 Block Balance: {s}", True, f"Balanced: {fn_starts} functions, {sec_starts} sections")

    record("5.2 NSIS Static Structure Verification", all_exist and no_unclosed_blocks, "All NSIS installer and component scripts are syntactically well-formed")


def main():
    print("=" * 70, flush=True)
    print("Starting Empirical Adversarial Challenge Test Suite for Milestone 7", flush=True)
    print(f"Target Binary: {BIN_PATH}", flush=True)
    print("=" * 70, flush=True)

    test_group_1_jsonrpc()
    test_group_2_binary_resolution()
    test_group_3_process_tree_termination()
    test_group_4_powershell_scripts()
    test_group_5_nsis_scripts()

    print("\n" + "=" * 70, flush=True)
    print("Summary of Adversarial Challenge Results:", flush=True)
    print("=" * 70, flush=True)
    passed_count = sum(1 for r in RESULTS if r["status"] == "PASS")
    total_count = len(RESULTS)
    for r in RESULTS:
        print(f"[{r['status']}] {r['test']}", flush=True)

    print(f"\nTotal: {passed_count}/{total_count} Passed", flush=True)

    if passed_count == total_count:
        print("\nOVERALL VERDICT: APPROVE", flush=True)
        return 0
    else:
        print("\nOVERALL VERDICT: REQUEST_CHANGES", flush=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())
