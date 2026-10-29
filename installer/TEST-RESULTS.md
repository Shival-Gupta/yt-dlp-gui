# Windows 10/11 x64 Installer & Integration Test Results

**Date:** 2026-10-29  
**Platform:** Windows 10 22H2 / Windows 11 x64  
**Target:** `YTDeck-Setup-v1.0.0.exe`  
**Execution Mode:** `currentUser` (`$LOCALAPPDATA\Programs\yt-dlp-gui`)

---

## 1. Test Summary

| Test ID | Test Scenario | Expected Outcome | Status |
|---|---|---|---|
| **TEST-INST-01** | Initial Execution & SmartScreen | Self-signed warning appears; can bypass with "More info → Run anyway" | **PASS** |
| **TEST-INST-02** | License & Directory Agreement | Shows MIT license, installs into user LocalAppData without UAC elevation | **PASS** |
| **TEST-INST-03** | Custom NSDialogs Components | 16 controls across 7 functional groups render with correct defaults | **PASS** |
| **TEST-INST-04** | FFmpeg & FFprobe Download | Downloads release zip from GitHub, unpacks executables into `bin/` | **PASS** |
| **TEST-INST-05** | Deno Runtime Download | Downloads official Deno zip, unpacks `deno.exe` into `bin/` | **PASS** |
| **TEST-INST-06** | AtomicParsley / aria2c | Optional components download cleanly when enabled; skipped when off | **PASS** |
| **TEST-INST-07** | Explorer Context Menus | Right-click entries present on files (`*`) and directories (`Directory`) | **PASS** |
| **TEST-INST-08** | Custom Protocol `ytdeck://` | Browser URLs (`ytdeck://download?url=...`) trigger the application | **PASS** |
| **TEST-INST-09** | User PATH Integration | `$INSTDIR\bin` added to User PATH; environment change broadcast | **PASS** |
| **TEST-INST-10** | AI Agent MCP Registration | `patch-mcp-configs.ps1` successfully configures Claude, Cursor, Antigravity | **PASS** |
| **TEST-INST-11** | AI Agent SKILL.md Registration | `install-skill.ps1` detects environments and deploys `SKILL.md` | **PASS** |
| **TEST-INST-12** | Start Menu & Desktop Shortcuts | Shortcuts created pointing to installed executable and uninstaller | **PASS** |
| **TEST-INST-13** | Clean Uninstallation | All files, registry keys, shortcuts, and PATH entries cleanly removed | **PASS** |
| **TEST-INST-14** | User Data Retention Option | Prompts user before deleting settings/history; preserves downloaded media | **PASS** |

---

## 2. Component Selection Matrix Verification

All 7 component groups verified against the specifications:

1. **Core Application (Locked Required):**
   - `yt-dlp GUI App`: Checked & Disabled
   - `yt-dlp Engine Sidecar`: Checked & Disabled
2. **Media Processing:**
   - `FFmpeg & FFprobe`: Default Checked
   - `AtomicParsley`: Default Unchecked
3. **JavaScript Runtime (Radio Group):**
   - `Deno (Fastest)`: Default Checked
   - `Node.js LTS`: Unchecked
   - `Skip Runtime`: Unchecked
4. **External Downloader:**
   - `aria2c Multi-connection Accelerator`: Default Unchecked
5. **AI Agent Integration:**
   - `ytdeck-mcp Server Binary`: Default Checked
   - `Register Skill`: Default Checked
6. **Windows System Integration:**
   - `Start Menu Shortcut`: Default Checked
   - `Desktop Shortcut`: Default Checked
   - `Explorer Context Menu`: Default Checked
   - `Add bin/ to User PATH`: Default Checked
   - `Register ytdeck:// URL Protocol`: Default Checked
7. **Startup:**
   - `Auto-start MCP Server on Windows Login`: Default Unchecked

---

## 3. Uninstaller Verification Details

- **Shortcuts:** Successfully deleted `$SMPROGRAMS\yt-dlp GUI\` and `$DESKTOP\yt-dlp GUI.lnk`.
- **Registry Keys:** Successfully pruned `HKCU\Software\Classes\*\shell\YtdlpGUI`, `HKCU\Software\Classes\Directory\shell\YtdlpGUI`, `HKCU\Software\Classes\ytdeck`, `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\YTDeckMCP`, and Add/Remove programs key.
- **Environment:** Cleanly removed `$INSTDIR\bin` from `HKCU\Environment\PATH` and dispatched `WM_SETTINGCHANGE`.
- **Files:** Cleanly removed binary folder `$INSTDIR\bin` and resources folder `$INSTDIR\resources`.
- **Data Preservation:** User prompted via Message Box (`MB_YESNO`). If "No", `$APPDATA\com.shival-gupta.yt-dlp-gui` retained. User's downloaded output directories never touched.
