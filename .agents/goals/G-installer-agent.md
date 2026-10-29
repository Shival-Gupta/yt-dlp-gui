# Subagent G — Installer Agent

## Mission
Build the Windows NSIS installer for yt-dlp-gui. One EXE that a non-technical user runs and gets everything: the app, yt-dlp, ffmpeg downloaded at install time, AI agent integration, Start Menu shortcuts, and Windows shell integration.

## Context
- **Repo:** `d:\Projects\yt-ig-dowloader\yt-dlp-gui`
- **Depends on:** Subagents D + E + F must be complete (polished app + MCP binary + SKILL.md)
- **Installer tool:** NSIS via `cargo tauri build --target nsis`
- **Installer type:** ~25 MB base + downloads ffmpeg at runtime (~50 MB)
- **Code signing:** Self-signed certificate (SmartScreen warnings expected — documented)

## Decisions (locked)
| Setting | Value |
|---|---|
| ffmpeg | Downloaded at install time from yt-dlp/FFmpeg-Builds latest release |
| Windows target | x64 only (v1.0) |
| Installer type | NSIS (not WiX) |
| Code signing | Self-signed dev cert |
| Minimum OS | Windows 10 1903+ (x64) |

## Ordered Task List (commit after each ✅)

### INST-INIT-01: Configure Tauri NSIS bundler
In `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "identifier": "com.shival-gupta.yt-dlp-gui",
    "icon": ["icons/icon.ico"],
    "nsis": {
      "displayLanguageSelector": false,
      "languages": ["English"],
      "installMode": "currentUser",
      "minimumWebview2Version": "108.0.1462.0",
      "shortcutName": "yt-dlp GUI",
      "wix": null
    },
    "externalBin": ["binaries/yt-dlp", "binaries/ytdeck-mcp"]
  }
}
```
Verify `cargo tauri build --target nsis` produces a basic installer.
Commit: `chore: configure Tauri NSIS bundler baseline`

### INST-INIT-02: App icons
Create all required icon sizes in `src-tauri/icons/`:
- `icon.ico` — Windows multi-size ICO (16, 32, 48, 64, 128, 256 px)
- `icon.png` — 512×512 PNG
- `icon-32.png`, `icon-128.png`, `icon-256.png`

Use yt-dlp GUI logo concept: a download arrow over a film strip, or a simplified "YD" monogram. Use Inkscape or any SVG → ICO pipeline. A placeholder icon is acceptable for v1 — just needs to be distinct from default Tauri icon.

Commit: `feat: add app icons (all sizes) for NSIS installer`

### INST-PAGE-01: Custom NSIS component selection page
Create `installer/components.nsi` — a custom NSDialogs page inserted after the standard "Install Directory" page:

```nsi
; Components page using NSDialogs
; Each component is a checkbox control
; Component IDs and their install functions are defined below

!include "MUI2.nsh"
!include "NSDialogs.nsh"
!include "LogicLib.nsh"

; Component flags (set to 1 = install, 0 = skip)
Var /GLOBAL COMP_FFMPEG        ; default: 1
Var /GLOBAL COMP_ATOMICPARSLEY ; default: 0
Var /GLOBAL COMP_DENO          ; default: 1
Var /GLOBAL COMP_ARIA2C        ; default: 0
Var /GLOBAL COMP_MCP_SERVER    ; default: 1
Var /GLOBAL COMP_AI_SKILL      ; default: 1
Var /GLOBAL COMP_CONTEXT_MENU  ; default: 1
Var /GLOBAL COMP_DESKTOP_SC    ; default: 1
Var /GLOBAL COMP_START_MENU    ; default: 1
Var /GLOBAL COMP_PATH_ADD      ; default: 1
Var /GLOBAL COMP_URL_PROTOCOL  ; default: 1
Var /GLOBAL COMP_MCP_AUTOSTART ; default: 0

Page custom ComponentsPageCreate ComponentsPageLeave
```

The custom page renders with `NSD_Create*` controls for each component. See reference: https://nsis.sourceforge.io/Docs/NSDialogs/Readme.html

Group the checkboxes visually with `NSD_CreateGroupBox`:
1. **Core** (greyed disabled): yt-dlp GUI App ✅, yt-dlp ✅
2. **Media Processing**: FFmpeg+FFprobe ✅, AtomicParsley ☐
3. **JavaScript Runtime (pick one for YouTube)**: Deno ✅ (radio), Node.js LTS ○ (radio), Skip ○ (radio)
4. **External Downloader**: aria2c ☐
5. **AI Agent Integration**: MCP Server ✅, Install Skill for AI Agents ✅
6. **System Integration**: Windows Start Menu ✅, Desktop Shortcut ✅, Context Menu ✅, Add to PATH ✅, URL Protocol Handler ✅
7. **Startup**: Auto-start MCP Server on login ☐

Commit: `feat: implement custom NSIS component selection page (NSDialogs)`

### INST-FFMPEG-01: FFmpeg download at install time
Create `installer/download-ffmpeg.nsi`:
```nsi
; Downloads ffmpeg + ffprobe from GitHub yt-dlp/FFmpeg-Builds
; Release: https://github.com/yt-dlp/FFmpeg-Builds/releases/latest
; File: ffmpeg-master-latest-win64-gpl.zip
; Extract: ffmpeg.exe and ffprobe.exe → $INSTDIR\bin\

Section "FFmpeg" SEC_FFMPEG
  StrCmp $COMP_FFMPEG "1" 0 skip_ffmpeg
  
  DetailPrint "Downloading FFmpeg..."
  NSISdl::download /TIMEOUT=60000 \
    "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" \
    "$TEMP\ffmpeg.zip"
  Pop $0
  StrCmp $0 "success" 0 ffmpeg_failed
  
  DetailPrint "Extracting FFmpeg..."
  nsisunz::UnzipToLog "$TEMP\ffmpeg.zip" "$INSTDIR\bin" "ffmpeg-*\bin\ffmpeg.exe"
  nsisunz::UnzipToLog "$TEMP\ffmpeg.zip" "$INSTDIR\bin" "ffmpeg-*\bin\ffmpeg.exe"
  ; Flatten: move from nested dir to $INSTDIR\bin
  
  Delete "$TEMP\ffmpeg.zip"
  Goto done_ffmpeg
  
  ffmpeg_failed:
  MessageBox MB_ICONEXCLAMATION "FFmpeg download failed. You can install it manually later from Settings."
  
  skip_ffmpeg:
  done_ffmpeg:
SectionEnd
```
Commit: `feat: implement FFmpeg download at install time`

### INST-DENO-01: Deno download at install time
Create `installer/download-deno.nsi`:
```nsi
; Downloads Deno from https://github.com/denoland/deno/releases/latest
; File: deno-x86_64-pc-windows-msvc.zip → deno.exe → $INSTDIR\bin\

Section "Deno (JavaScript Runtime)" SEC_DENO
  StrCmp $COMP_DENO "1" 0 skip_deno
  ; Similar pattern to FFmpeg download
  ; Download: https://github.com/denoland/deno/releases/download/v<latest>/deno-x86_64-pc-windows-msvc.zip
  ; Requires fetching latest version first via GitHub API or hardcoded URL redirect
SectionEnd
```
Commit: `feat: implement Deno download at install time`

### INST-ATOMICPARSLEY-01: AtomicParsley install
```nsi
; Download AtomicParsley.exe from https://github.com/wez/atomicparsley/releases/latest
; File: AtomicParsley-windows-x86_64.zip → AtomicParsley.exe → $INSTDIR\bin\
Section "AtomicParsley" SEC_AP
  StrCmp $COMP_ATOMICPARSLEY "1" 0 skip_ap
  ; similar pattern
SectionEnd
```
Commit: `feat: implement AtomicParsley optional install`

### INST-ARIA2C-01: aria2c install
```nsi
; Download aria2c from https://github.com/aria2/aria2/releases/latest
; File: aria2-x.x.x-win-64bit-build1.zip → aria2c.exe → $INSTDIR\bin\
Section "aria2c" SEC_ARIA2
  StrCmp $COMP_ARIA2C "1" 0 skip_aria2
  ; similar pattern
SectionEnd
```
Commit: `feat: implement aria2c optional install`

### INST-MCP-01: Install ytdeck-mcp and configure
```nsi
; Copy ytdeck-mcp.exe (bundled in installer) to $INSTDIR
; Then run patch-mcp-configs.ps1 to add to Claude, Antigravity, Cursor configs

Section "MCP Server" SEC_MCP
  StrCmp $COMP_MCP_SERVER "1" 0 skip_mcp
  
  ; ytdeck-mcp.exe is bundled in the installer resources
  File "/oname=$INSTDIR\ytdeck-mcp.exe" "..\..\target\release\ytdeck-mcp.exe"
  
  ; Run the PowerShell config patcher
  ExecWait 'powershell.exe -ExecutionPolicy Bypass -File "$INSTDIR\resources\patch-mcp-configs.ps1" -McpPath "$INSTDIR\ytdeck-mcp.exe"'
  
  skip_mcp:
SectionEnd
```
Commit: `feat: install ytdeck-mcp.exe and patch AI agent MCP configs`

### INST-SKILL-01: Install AI agent Skill
```nsi
Section "AI Agent Skill" SEC_SKILL
  StrCmp $COMP_AI_SKILL "1" 0 skip_skill
  
  ; Run the PowerShell skill installer
  ExecWait 'powershell.exe -ExecutionPolicy Bypass -File "$INSTDIR\resources\install-skill.ps1"'
  
  skip_skill:
SectionEnd
```
Commit: `feat: install SKILL.md for AI agents via NSIS`

### INST-REGISTRY-01: Windows context menu
```nsi
; Right-click "Download with yt-dlp GUI" on any file/link
Section "Windows Context Menu" SEC_CTX
  StrCmp $COMP_CONTEXT_MENU "1" 0 skip_ctx
  
  ; For * (all files)
  WriteRegStr HKCU "Software\Classes\*\shell\YtdlpGUI" "" "Download with yt-dlp GUI"
  WriteRegStr HKCU "Software\Classes\*\shell\YtdlpGUI" "Icon" "$INSTDIR\yt-dlp-gui.exe,0"
  WriteRegStr HKCU "Software\Classes\*\shell\YtdlpGUI\command" "" '"$INSTDIR\yt-dlp-gui.exe" "%1"'
  
  ; For Directory (folder right-click)
  WriteRegStr HKCU "Software\Classes\Directory\shell\YtdlpGUI" "" "Download here with yt-dlp GUI"
  WriteRegStr HKCU "Software\Classes\Directory\shell\YtdlpGUI\command" "" '"$INSTDIR\yt-dlp-gui.exe" --output-dir "%1"'
  
  skip_ctx:
SectionEnd
```
Commit: `feat: add Windows Explorer context menu integration`

### INST-REGISTRY-02: URL protocol handler
```nsi
; Register ytdeck:// protocol so browsers can trigger downloads
; ytdeck://download?url=https://youtube.com/...

Section "URL Protocol Handler" SEC_URL
  StrCmp $COMP_URL_PROTOCOL "1" 0 skip_url
  
  WriteRegStr HKCU "Software\Classes\ytdeck" "" "URL:YTDeck Protocol"
  WriteRegStr HKCU "Software\Classes\ytdeck" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\ytdeck\DefaultIcon" "" "$INSTDIR\yt-dlp-gui.exe,0"
  WriteRegStr HKCU "Software\Classes\ytdeck\shell\open\command" "" '"$INSTDIR\yt-dlp-gui.exe" "%1"'
  
  skip_url:
SectionEnd
```
Commit: `feat: register ytdeck:// URL protocol handler`

### INST-REGISTRY-03: PATH modification
```nsi
; Add $INSTDIR\bin to user PATH so yt-dlp.exe is usable from terminal
Section "Add to PATH" SEC_PATH
  StrCmp $COMP_PATH_ADD "1" 0 skip_path
  
  ; Read current PATH
  ReadRegStr $0 HKCU "Environment" "PATH"
  ; Append ;$INSTDIR\bin if not already present
  ${StrContains} $1 "$INSTDIR\bin" $0
  StrCmp $1 "" 0 skip_path
  WriteRegExpandStr HKCU "Environment" "PATH" "$0;$INSTDIR\bin"
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  
  skip_path:
SectionEnd
```
Commit: `feat: add yt-dlp bin directory to user PATH`

### INST-REGISTRY-04: MCP server auto-start
```nsi
; Add ytdeck-mcp to HKCU Run key so it starts on login in HTTP mode
Section "Auto-start MCP Server" SEC_AUTOSTART
  StrCmp $COMP_MCP_AUTOSTART "1" 0 skip_autostart
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "YTDeckMCP" \
    '"$INSTDIR\ytdeck-mcp.exe" --transport http --port 7531'
  skip_autostart:
SectionEnd
```
Commit: `feat: optional MCP server auto-start on Windows login`

### INST-SHORTCUTS-01: Start Menu + Desktop shortcuts
```nsi
; Start Menu
Section "Start Menu Shortcut" SEC_STARTMENU
  StrCmp $COMP_START_MENU "1" 0 skip_sm
  CreateDirectory "$SMPROGRAMS\yt-dlp GUI"
  CreateShortcut "$SMPROGRAMS\yt-dlp GUI\yt-dlp GUI.lnk" "$INSTDIR\yt-dlp-gui.exe"
  CreateShortcut "$SMPROGRAMS\yt-dlp GUI\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  skip_sm:
SectionEnd

; Desktop
Section "Desktop Shortcut" SEC_DESKTOP
  StrCmp $COMP_DESKTOP_SC "1" 0 skip_desktop
  CreateShortcut "$DESKTOP\yt-dlp GUI.lnk" "$INSTDIR\yt-dlp-gui.exe"
  skip_desktop:
SectionEnd
```
Commit: `feat: add Start Menu and Desktop shortcuts`

### INST-POWERSHELL-01: patch-mcp-configs.ps1
Create `installer/resources/patch-mcp-configs.ps1`:
```powershell
param([string]$McpPath = "")

if (-not $McpPath) {
    $McpPath = Join-Path (Split-Path $PSScriptRoot) "ytdeck-mcp.exe"
}

$mcpEntry = @{
    command = $McpPath
    args = @()
}

$configFiles = @{
    "Claude Desktop" = "$env:APPDATA\Claude\claude_desktop_config.json"
    "Cursor" = "$env:APPDATA\Cursor\User\settings.json"  # Check actual path
    "Windsurf" = "$env:APPDATA\Windsurf\User\settings.json"
    "Continue" = "$env:USERPROFILE\.continue\config.json"
    "Antigravity" = "$env:USERPROFILE\.gemini\config\mcp_servers.json"
}

foreach ($tool in $configFiles.GetEnumerator()) {
    $configPath = $tool.Value
    if (-not (Test-Path $configPath)) {
        continue
    }
    
    Write-Host "Patching $($tool.Key) at $configPath..."
    
    # Backup original
    Copy-Item $configPath "$configPath.ytdeck-backup" -Force
    
    # Read and parse
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    
    # Add/update mcpServers.ytdeck
    if (-not $config.mcpServers) {
        $config | Add-Member -NotePropertyName mcpServers -NotePropertyValue @{} -Force
    }
    $config.mcpServers | Add-Member -NotePropertyName ytdeck -NotePropertyValue $mcpEntry -Force
    
    # Write back
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
    Write-Host "  ✓ Added ytdeck MCP server to $($tool.Key)"
}
```
Commit: `feat: create patch-mcp-configs.ps1 for AI agent MCP config patching`

### INST-UNINSTALL-01: Full uninstaller
```nsi
Section "Uninstall"
  ; App files
  Delete "$INSTDIR\yt-dlp-gui.exe"
  Delete "$INSTDIR\ytdeck-mcp.exe"
  Delete "$INSTDIR\bin\yt-dlp.exe"
  Delete "$INSTDIR\bin\ffmpeg.exe"
  Delete "$INSTDIR\bin\ffprobe.exe"
  Delete "$INSTDIR\bin\deno.exe"
  Delete "$INSTDIR\bin\aria2c.exe"
  Delete "$INSTDIR\bin\AtomicParsley.exe"
  RMDir /r "$INSTDIR\resources"
  RMDir "$INSTDIR\bin"
  RMDir "$INSTDIR"
  
  ; Registry
  DeleteRegKey HKCU "Software\Classes\*\shell\YtdlpGUI"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\YtdlpGUI"
  DeleteRegKey HKCU "Software\Classes\ytdeck"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "YTDeckMCP"
  
  ; PATH cleanup (remove $INSTDIR\bin from PATH)
  ; ... PATH manipulation logic
  
  ; Shortcuts
  Delete "$DESKTOP\yt-dlp GUI.lnk"
  Delete "$SMPROGRAMS\yt-dlp GUI\yt-dlp GUI.lnk"
  Delete "$SMPROGRAMS\yt-dlp GUI\Uninstall.lnk"
  RMDir "$SMPROGRAMS\yt-dlp GUI"
  
  ; Note: do NOT delete user's download history, settings, or downloaded files
  MessageBox MB_YESNO "Remove yt-dlp GUI user settings and history? (Your downloaded files will not be deleted)" IDNO skip_userdata
  RMDir /r "$APPDATA\com.shival-gupta.yt-dlp-gui"
  skip_userdata:
  
  Delete "$INSTDIR\Uninstall.exe"
SectionEnd
```
Commit: `feat: implement full uninstaller with user data option`

### INST-SIGNING-01: Self-signed certificate
Create self-signed certificate for code signing:
```powershell
# Generate self-signed cert
$cert = New-SelfSignedCertificate `
  -Type CodeSigning `
  -Subject "CN=yt-dlp-gui, O=Shival-Gupta" `
  -KeyUsage DigitalSignature `
  -FriendlyName "yt-dlp-gui Code Signing" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3")

# Export to PFX
$certPassword = ConvertTo-SecureString -String "ytdlpgui-dev" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "installer\dev-signing.pfx" -Password $certPassword

# Sign the installer
signtool sign /f "installer\dev-signing.pfx" /p "ytdlpgui-dev" /t "http://timestamp.digicert.com" /fd sha256 "YTDeck-Setup-v1.0.0.exe"
```
Document in `installer/SIGNING.md` that this is a dev self-signed cert and SmartScreen warnings are expected. Include instructions for users to click "More info → Run anyway".

Commit: `chore: set up self-signed code signing certificate for installer`

### INST-TEST-01: Test on clean Windows 10 x64
Use a Windows 10 VM (Hyper-V or VMware):
1. Run `YTDeck-Setup-v1.0.0.exe` on a clean install
2. Verify: SmartScreen warning appears, user can bypass with "More info → Run anyway"
3. Select all checkboxes on component page
4. Complete install
5. Verify: App launches, Start Menu shortcut works, Desktop shortcut works
6. Verify: ffmpeg.exe exists in install dir bin
7. Verify: Right-click context menu appears in Explorer
8. Verify: `yt-dlp --version` works in a new terminal (PATH check)
9. Test an actual download
10. Run uninstaller — verify clean removal

Document results in `installer/TEST-RESULTS.md`.
Commit: `test: Windows 10 x64 clean install test results`

## Definition of Done
- [ ] `cargo tauri build --target nsis` produces `YTDeck-Setup-v1.0.0.exe`
- [ ] Installer is ~25-35 MB (before ffmpeg download)
- [ ] Custom component selection page renders with all 12+ checkboxes
- [ ] FFmpeg downloads and installs successfully
- [ ] Deno downloads and installs successfully
- [ ] ytdeck-mcp.exe installed and AI agent configs patched
- [ ] SKILL.md installed to all detected AI tool skill dirs
- [ ] Context menu appears in Windows Explorer
- [ ] ytdeck:// URL protocol registered
- [ ] yt-dlp added to user PATH
- [ ] Start Menu + Desktop shortcuts created
- [ ] Self-signed cert applied (with SmartScreen documentation)
- [ ] Full uninstaller tested and clean
- [ ] Test results documented for Windows 10 x64
- [ ] All commits pushed to `main`
