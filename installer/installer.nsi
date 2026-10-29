; ==============================================================================
; yt-dlp GUI - Windows NSIS Installer Script
; Target: Windows 10/11 x64 (currentUser installation)
; ==============================================================================

Unicode true
RequestExecutionLevel user

; Product Definitions
!define PRODUCT_NAME "yt-dlp GUI"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Shival Gupta"
!define PRODUCT_WEB_SITE "https://github.com/Shival-Gupta/yt-dlp-gui"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\yt-dlp-gui.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

; MUI2 & Plugin Includes
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "WinMessages.nsh"

; Installer Configuration
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\YTDeck-Setup-v${PRODUCT_VERSION}.exe"
InstallDir "$LOCALAPPDATA\Programs\yt-dlp-gui"
InstallDirRegKey HKCU "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

; Visual Settings & Artwork
!define MUI_ICON "resources\app.ico"
!define MUI_UNICON "resources\app.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "resources\header.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_ABORTWARNING

; ------------------------------------------------------------------------------
; Installer Pages Flow
; ------------------------------------------------------------------------------
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY

; Custom Component Selection Page
Page custom ComponentsPageCreate ComponentsPageLeave

!insertmacro MUI_PAGE_INSTFILES

; Finish Page
!define MUI_FINISHPAGE_RUN "$INSTDIR\yt-dlp-gui.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch yt-dlp GUI"
!insertmacro MUI_PAGE_FINISH

; ------------------------------------------------------------------------------
; Uninstaller Pages Flow
; ------------------------------------------------------------------------------
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Language Selection
!insertmacro MUI_LANGUAGE "English"

; Include Custom Page and Download Sections
!include "components.nsi"
!include "download-ffmpeg.nsi"
!include "download-deno.nsi"
!include "download-atomicparsley.nsi"
!include "download-aria2c.nsi"

; ------------------------------------------------------------------------------
; Installer Initialization
; ------------------------------------------------------------------------------
Function .onInit
  ; Ensure running on 64-bit Windows
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "This application requires a 64-bit version of Windows."
    Abort
  ${EndIf}

  ; Initialize Component Selection Defaults
  Call InitComponentDefaults
FunctionEnd

; ------------------------------------------------------------------------------
; Main Core Installation Section
; ------------------------------------------------------------------------------
Section "!Core Application" SEC_CORE
  SectionIn RO ; Read-Only (Required)

  DetailPrint "Installing core application files..."
  SetOutPath "$INSTDIR"

  ; Create destination directory structure
  CreateDirectory "$INSTDIR\bin"
  CreateDirectory "$INSTDIR\resources"

  ; Install Main Executables
  ; Check if built binaries exist; if not in build directory, gracefully check targets
  File /nonfatal "/oname=$INSTDIR\yt-dlp-gui.exe" "..\src-tauri\target\x86_64-pc-windows-msvc\release\yt-dlp-gui.exe"
  File /nonfatal "/oname=$INSTDIR\yt-dlp-gui.exe" "..\target\release\yt-dlp-gui.exe"
  File /nonfatal "/oname=$INSTDIR\yt-dlp-gui.exe" "..\src-tauri\target\release\yt-dlp-gui.exe"

  File /nonfatal "/oname=$INSTDIR\ytdeck-mcp.exe" "..\target\release\ytdeck-mcp.exe"
  File /nonfatal "/oname=$INSTDIR\ytdeck-mcp.exe" "..\src-tauri\target\x86_64-pc-windows-msvc\release\ytdeck-mcp.exe"
  File /nonfatal "/oname=$INSTDIR\ytdeck-mcp.exe" "..\src-tauri\target\release\ytdeck-mcp.exe"

  ; Install bundled yt-dlp sidecar
  SetOutPath "$INSTDIR\bin"
  File /nonfatal "/oname=$INSTDIR\bin\yt-dlp.exe" "..\src-tauri\binaries\yt-dlp-x86_64-pc-windows-msvc.exe"
  File /nonfatal "/oname=$INSTDIR\bin\yt-dlp.exe" "..\src-tauri\binaries\yt-dlp.exe"

  ; Install bundled resources & automation scripts
  SetOutPath "$INSTDIR\resources"
  File "resources\patch-mcp-configs.ps1"
  File "resources\install-skill.ps1"
  File "resources\SKILL.md"
  File "resources\app.ico"

  ; Register App Path in HKCU
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\yt-dlp-gui.exe"
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "Path" "$INSTDIR;$INSTDIR\bin"

  ; Register Add/Remove Programs Information
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\yt-dlp-gui.exe,0"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "QuietUninstallString" '"$INSTDIR\Uninstall.exe" /S'
  WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoRepair" 1

  ; Generate Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

; ------------------------------------------------------------------------------
; Integrations and Configuration Section
; ------------------------------------------------------------------------------
Section "System Integrations" SEC_INTEGRATIONS
  ; === AI Agent Configuration ===
  ${If} $COMP_MCP_SERVER == "1"
    DetailPrint "Configuring AI Agent MCP clients (Claude, Cursor, Windsurf)..."
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -File "$INSTDIR\resources\patch-mcp-configs.ps1" -McpPath "$INSTDIR\ytdeck-mcp.exe"'
  ${EndIf}

  ${If} $COMP_AI_SKILL == "1"
    DetailPrint "Installing AI Agent Skill documentation..."
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -File "$INSTDIR\resources\install-skill.ps1"'
  ${EndIf}

  ; === Windows Explorer Context Menu ===
  ${If} $COMP_CONTEXT_MENU == "1"
    DetailPrint "Registering Windows Explorer context menu actions..."
    ; File Right-click
    WriteRegStr HKCU "Software\Classes\*\shell\YtdlpGUI" "" "Download with yt-dlp GUI"
    WriteRegStr HKCU "Software\Classes\*\shell\YtdlpGUI" "Icon" "$INSTDIR\yt-dlp-gui.exe,0"
    WriteRegStr HKCU "Software\Classes\*\shell\YtdlpGUI\command" "" '"$INSTDIR\yt-dlp-gui.exe" "%1"'

    ; Directory / Folder Right-click
    WriteRegStr HKCU "Software\Classes\Directory\shell\YtdlpGUI" "" "Download here with yt-dlp GUI"
    WriteRegStr HKCU "Software\Classes\Directory\shell\YtdlpGUI" "Icon" "$INSTDIR\yt-dlp-gui.exe,0"
    WriteRegStr HKCU "Software\Classes\Directory\shell\YtdlpGUI\command" "" '"$INSTDIR\yt-dlp-gui.exe" --output-dir "%1"'
  ${EndIf}

  ; === Custom URL Protocol: ytdeck:// ===
  ${If} $COMP_URL_PROTOCOL == "1"
    DetailPrint "Registering ytdeck:// browser protocol handler..."
    WriteRegStr HKCU "Software\Classes\ytdeck" "" "URL:YTDeck Protocol"
    WriteRegStr HKCU "Software\Classes\ytdeck" "URL Protocol" ""
    WriteRegStr HKCU "Software\Classes\ytdeck\DefaultIcon" "" "$INSTDIR\yt-dlp-gui.exe,0"
    WriteRegStr HKCU "Software\Classes\ytdeck\shell\open\command" "" '"$INSTDIR\yt-dlp-gui.exe" "%1"'
  ${EndIf}

  ; === Add bin to User PATH ===
  ${If} $COMP_PATH_ADD == "1"
    DetailPrint "Adding $INSTDIR\bin to User PATH..."
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "\
      `$binPath = ''$INSTDIR\bin''; \
      `$currentPath = [Environment]::GetEnvironmentVariable(''PATH'', ''User''); \
      if (-not (`$currentPath -split '';'' -contains `$binPath)) { \
        `$newPath = if ([string]::IsNullOrWhiteSpace(`$currentPath)) { `$binPath } else { `$currentPath + '';'' + `$binPath }; \
        [Environment]::SetEnvironmentVariable(''PATH'', `$newPath, ''User''); \
        Write-Host ''PATH updated successfully.''; \
      }"'
    SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  ${EndIf}

  ; === Auto-start MCP Server on Windows Login ===
  ${If} $COMP_MCP_AUTOSTART == "1"
    DetailPrint "Registering MCP Server background autostart on user login..."
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "YTDeckMCP" '"$INSTDIR\ytdeck-mcp.exe" --transport http --port 7531'
  ${EndIf}

  ; === Start Menu Shortcuts ===
  ${If} $COMP_START_MENU == "1"
    DetailPrint "Creating Start Menu shortcuts..."
    CreateDirectory "$SMPROGRAMS\yt-dlp GUI"
    CreateShortcut "$SMPROGRAMS\yt-dlp GUI\yt-dlp GUI.lnk" "$INSTDIR\yt-dlp-gui.exe" "" "$INSTDIR\yt-dlp-gui.exe" 0
    CreateShortcut "$SMPROGRAMS\yt-dlp GUI\Uninstall yt-dlp GUI.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0
  ${EndIf}

  ; === Desktop Shortcut ===
  ${If} $COMP_DESKTOP_SC == "1"
    DetailPrint "Creating Desktop shortcut..."
    CreateShortcut "$DESKTOP\yt-dlp GUI.lnk" "$INSTDIR\yt-dlp-gui.exe" "" "$INSTDIR\yt-dlp-gui.exe" 0
  ${EndIf}
SectionEnd

; ------------------------------------------------------------------------------
; Uninstaller Implementation
; ------------------------------------------------------------------------------
Section "Uninstall"
  DetailPrint "Removing yt-dlp GUI and associated integrations..."

  ; 1. Remove Shortcuts
  Delete "$DESKTOP\yt-dlp GUI.lnk"
  Delete "$SMPROGRAMS\yt-dlp GUI\yt-dlp GUI.lnk"
  Delete "$SMPROGRAMS\yt-dlp GUI\Uninstall yt-dlp GUI.lnk"
  RMDir "$SMPROGRAMS\yt-dlp GUI"

  ; 2. Remove Registry Integrations
  DeleteRegKey HKCU "Software\Classes\*\shell\YtdlpGUI"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\YtdlpGUI"
  DeleteRegKey HKCU "Software\Classes\ytdeck"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "YTDeckMCP"
  DeleteRegKey HKCU "${PRODUCT_DIR_REGKEY}"
  DeleteRegKey HKCU "${PRODUCT_UNINST_KEY}"

  ; 3. Remove bin from User PATH
  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "\
    `$binPath = ''$INSTDIR\bin''; \
    `$currentPath = [Environment]::GetEnvironmentVariable(''PATH'', ''User''); \
    if (`$currentPath) { \
      `$newParts = `$currentPath -split '';'' | Where-Object { `$_ -ne `$binPath -and `$_ -ne '''' }; \
      `$newPath = `$newParts -join '';''; \
      [Environment]::SetEnvironmentVariable(''PATH'', `$newPath, ''User''); \
    }"'
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000

  ; 4. Prompt for User Data / Settings removal (Preserving downloaded files)
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to delete user preferences and download history?$\r$\n$\r$\n(Note: Your downloaded video and audio files will NOT be deleted.)" IDNO skip_appdata
  RMDir /r "$APPDATA\com.shival-gupta.yt-dlp-gui"
skip_appdata:

  ; 5. Remove Application Files and Binaries
  Delete "$INSTDIR\yt-dlp-gui.exe"
  Delete "$INSTDIR\ytdeck-mcp.exe"
  Delete "$INSTDIR\bin\yt-dlp.exe"
  Delete "$INSTDIR\bin\ffmpeg.exe"
  Delete "$INSTDIR\bin\ffprobe.exe"
  Delete "$INSTDIR\bin\deno.exe"
  Delete "$INSTDIR\bin\AtomicParsley.exe"
  Delete "$INSTDIR\bin\aria2c.exe"
  RMDir /r "$INSTDIR\resources"
  RMDir "$INSTDIR\bin"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  SetAutoClose true
SectionEnd
