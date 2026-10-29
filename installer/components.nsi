; ==============================================================================
; yt-dlp GUI - Custom Component Selection Page (NSDialogs)
; 16 selectable options across 7 functional groups
; ==============================================================================

!include "MUI2.nsh"
!include "NSDialogs.nsh"
!include "LogicLib.nsh"

; ------------------------------------------------------------------------------
; Global Component State Variables (1 = selected, 0 = skipped)
; ------------------------------------------------------------------------------
Var /GLOBAL COMP_CORE_APP
Var /GLOBAL COMP_CORE_YTDLP
Var /GLOBAL COMP_FFMPEG
Var /GLOBAL COMP_ATOMICPARSLEY
Var /GLOBAL COMP_DENO
Var /GLOBAL COMP_NODE
Var /GLOBAL COMP_JS_SKIP
Var /GLOBAL COMP_ARIA2C
Var /GLOBAL COMP_MCP_SERVER
Var /GLOBAL COMP_AI_SKILL
Var /GLOBAL COMP_START_MENU
Var /GLOBAL COMP_DESKTOP_SC
Var /GLOBAL COMP_CONTEXT_MENU
Var /GLOBAL COMP_PATH_ADD
Var /GLOBAL COMP_URL_PROTOCOL
Var /GLOBAL COMP_MCP_AUTOSTART

; UI Control Handles
Var /GLOBAL hDialog
Var /GLOBAL hCtl_CoreApp
Var /GLOBAL hCtl_CoreYtdlp
Var /GLOBAL hCtl_FFmpeg
Var /GLOBAL hCtl_AtomicParsley
Var /GLOBAL hCtl_Deno
Var /GLOBAL hCtl_Node
Var /GLOBAL hCtl_JsSkip
Var /GLOBAL hCtl_Aria2c
Var /GLOBAL hCtl_McpServer
Var /GLOBAL hCtl_AiSkill
Var /GLOBAL hCtl_StartMenu
Var /GLOBAL hCtl_DesktopSc
Var /GLOBAL hCtl_ContextMenu
Var /GLOBAL hCtl_PathAdd
Var /GLOBAL hCtl_UrlProtocol
Var /GLOBAL hCtl_McpAutostart

; ------------------------------------------------------------------------------
; Initialization of Default Settings
; ------------------------------------------------------------------------------
Function InitComponentDefaults
  StrCpy $COMP_CORE_APP "1"
  StrCpy $COMP_CORE_YTDLP "1"
  StrCpy $COMP_FFMPEG "1"
  StrCpy $COMP_ATOMICPARSLEY "0"
  StrCpy $COMP_DENO "1"
  StrCpy $COMP_NODE "0"
  StrCpy $COMP_JS_SKIP "0"
  StrCpy $COMP_ARIA2C "0"
  StrCpy $COMP_MCP_SERVER "1"
  StrCpy $COMP_AI_SKILL "1"
  StrCpy $COMP_START_MENU "1"
  StrCpy $COMP_DESKTOP_SC "1"
  StrCpy $COMP_CONTEXT_MENU "1"
  StrCpy $COMP_PATH_ADD "1"
  StrCpy $COMP_URL_PROTOCOL "1"
  StrCpy $COMP_MCP_AUTOSTART "0"
FunctionEnd

; ------------------------------------------------------------------------------
; Create Custom Components Page
; ------------------------------------------------------------------------------
Function ComponentsPageCreate
  !insertmacro MUI_HEADER_TEXT "Choose Components" "Select the optional components and integrations to install with yt-dlp GUI."

  nsDialogs::Create 1018
  Pop $hDialog
  ${If} $hDialog == error
    Abort
  ${EndIf}

  ; === Group 1: Core Application (Required) ===
  ${NSD_CreateGroupBox} 0 0 100% 28u "1. Core Application (Required)"
  Pop $0
  ${NSD_CreateCheckbox} 10u 12u 130u 10u "yt-dlp GUI App (Tauri v2)"
  Pop $hCtl_CoreApp
  ${NSD_Check} $hCtl_CoreApp
  EnableWindow $hCtl_CoreApp 0 ; Disabled (locked checked)

  ${NSD_CreateCheckbox} 150u 12u 130u 10u "yt-dlp Engine Sidecar"
  Pop $hCtl_CoreYtdlp
  ${NSD_Check} $hCtl_CoreYtdlp
  EnableWindow $hCtl_CoreYtdlp 0 ; Disabled (locked checked)

  ; === Group 2: Media Processing ===
  ${NSD_CreateGroupBox} 0 30u 100% 28u "2. Media Processing & Multiplexing"
  Pop $0
  ${NSD_CreateCheckbox} 10u 42u 130u 10u "FFmpeg & FFprobe (Recommended)"
  Pop $hCtl_FFmpeg
  ${If} $COMP_FFMPEG == "1"
    ${NSD_Check} $hCtl_FFmpeg
  ${EndIf}

  ${NSD_CreateCheckbox} 150u 42u 130u 10u "AtomicParsley (Metadata tagger)"
  Pop $hCtl_AtomicParsley
  ${If} $COMP_ATOMICPARSLEY == "1"
    ${NSD_Check} $hCtl_AtomicParsley
  ${EndIf}

  ; === Group 3: JavaScript Runtime (YouTube Extractor) ===
  ${NSD_CreateGroupBox} 0 60u 100% 28u "3. JavaScript Runtime (YouTube signature solver)"
  Pop $0
  ${NSD_CreateRadioButton} 10u 72u 85u 10u "Deno (Fastest)"
  Pop $hCtl_Deno
  ${NSD_CreateRadioButton} 105u 72u 90u 10u "Node.js LTS"
  Pop $hCtl_Node
  ${NSD_CreateRadioButton} 205u 72u 70u 10u "Skip Runtime"
  Pop $hCtl_JsSkip

  ${If} $COMP_NODE == "1"
    ${NSD_Check} $hCtl_Node
  ${ElseIf} $COMP_JS_SKIP == "1"
    ${NSD_Check} $hCtl_JsSkip
  ${Else}
    ${NSD_Check} $hCtl_Deno
  ${EndIf}

  ; === Group 4: External Downloader ===
  ${NSD_CreateGroupBox} 0 90u 100% 24u "4. External Downloader"
  Pop $0
  ${NSD_CreateCheckbox} 10u 101u 260u 10u "aria2c Multi-connection Download Accelerator"
  Pop $hCtl_Aria2c
  ${If} $COMP_ARIA2C == "1"
    ${NSD_Check} $hCtl_Aria2c
  ${EndIf}

  ; === Group 5: AI Agent Integration ===
  ${NSD_CreateGroupBox} 0 116u 100% 28u "5. AI Agent Integration (MCP)"
  Pop $0
  ${NSD_CreateCheckbox} 10u 128u 130u 10u "ytdeck-mcp Server Binary"
  Pop $hCtl_McpServer
  ${If} $COMP_MCP_SERVER == "1"
    ${NSD_Check} $hCtl_McpServer
  ${EndIf}

  ${NSD_CreateCheckbox} 150u 128u 140u 10u "Register Skill (Claude, Gemini, Cursor)"
  Pop $hCtl_AiSkill
  ${If} $COMP_AI_SKILL == "1"
    ${NSD_Check} $hCtl_AiSkill
  ${EndIf}

  ; === Group 6: System Integration ===
  ${NSD_CreateGroupBox} 0 146u 100% 40u "6. Windows System Integration"
  Pop $0
  ${NSD_CreateCheckbox} 10u 157u 90u 10u "Start Menu Shortcut"
  Pop $hCtl_StartMenu
  ${If} $COMP_START_MENU == "1"
    ${NSD_Check} $hCtl_StartMenu
  ${EndIf}

  ${NSD_CreateCheckbox} 105u 157u 85u 10u "Desktop Shortcut"
  Pop $hCtl_DesktopSc
  ${If} $COMP_DESKTOP_SC == "1"
    ${NSD_Check} $hCtl_DesktopSc
  ${EndIf}

  ${NSD_CreateCheckbox} 195u 157u 95u 10u "Explorer Context Menu"
  Pop $hCtl_ContextMenu
  ${If} $COMP_CONTEXT_MENU == "1"
    ${NSD_Check} $hCtl_ContextMenu
  ${EndIf}

  ${NSD_CreateCheckbox} 10u 171u 120u 10u "Add bin/ to User PATH"
  Pop $hCtl_PathAdd
  ${If} $COMP_PATH_ADD == "1"
    ${NSD_Check} $hCtl_PathAdd
  ${EndIf}

  ${NSD_CreateCheckbox} 150u 171u 135u 10u "Register ytdeck:// URL Protocol"
  Pop $hCtl_UrlProtocol
  ${If} $COMP_URL_PROTOCOL == "1"
    ${NSD_Check} $hCtl_UrlProtocol
  ${EndIf}

  ; === Group 7: Startup ===
  ${NSD_CreateGroupBox} 0 188u 100% 24u "7. Background Startup"
  Pop $0
  ${NSD_CreateCheckbox} 10u 198u 260u 10u "Auto-start MCP Server on Windows Login (HTTP:7531)"
  Pop $hCtl_McpAutostart
  ${If} $COMP_MCP_AUTOSTART == "1"
    ${NSD_Check} $hCtl_McpAutostart
  ${EndIf}

  nsDialogs::Show
FunctionEnd

; ------------------------------------------------------------------------------
; Save States from UI Controls
; ------------------------------------------------------------------------------
Function ComponentsPageLeave
  ; Core is always 1
  StrCpy $COMP_CORE_APP "1"
  StrCpy $COMP_CORE_YTDLP "1"

  ; Media Processing
  ${NSD_GetState} $hCtl_FFmpeg $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_FFMPEG "1"
  ${Else}
    StrCpy $COMP_FFMPEG "0"
  ${EndIf}

  ${NSD_GetState} $hCtl_AtomicParsley $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_ATOMICPARSLEY "1"
  ${Else}
    StrCpy $COMP_ATOMICPARSLEY "0"
  ${EndIf}

  ; JavaScript Runtime
  ${NSD_GetState} $hCtl_Deno $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_DENO "1"
    StrCpy $COMP_NODE "0"
    StrCpy $COMP_JS_SKIP "0"
  ${EndIf}

  ${NSD_GetState} $hCtl_Node $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_DENO "0"
    StrCpy $COMP_NODE "1"
    StrCpy $COMP_JS_SKIP "0"
  ${EndIf}

  ${NSD_GetState} $hCtl_JsSkip $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_DENO "0"
    StrCpy $COMP_NODE "0"
    StrCpy $COMP_JS_SKIP "1"
  ${EndIf}

  ; External Downloader
  ${NSD_GetState} $hCtl_Aria2c $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_ARIA2C "1"
  ${Else}
    StrCpy $COMP_ARIA2C "0"
  ${EndIf}

  ; AI Agent Integration
  ${NSD_GetState} $hCtl_McpServer $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_MCP_SERVER "1"
  ${Else}
    StrCpy $COMP_MCP_SERVER "0"
  ${EndIf}

  ${NSD_GetState} $hCtl_AiSkill $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_AI_SKILL "1"
  ${Else}
    StrCpy $COMP_AI_SKILL "0"
  ${EndIf}

  ; System Integration
  ${NSD_GetState} $hCtl_StartMenu $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_START_MENU "1"
  ${Else}
    StrCpy $COMP_START_MENU "0"
  ${EndIf}

  ${NSD_GetState} $hCtl_DesktopSc $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_DESKTOP_SC "1"
  ${Else}
    StrCpy $COMP_DESKTOP_SC "0"
  ${EndIf}

  ${NSD_GetState} $hCtl_ContextMenu $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_CONTEXT_MENU "1"
  ${Else}
    StrCpy $COMP_CONTEXT_MENU "0"
  ${EndIf}

  ${NSD_GetState} $hCtl_PathAdd $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_PATH_ADD "1"
  ${Else}
    StrCpy $COMP_PATH_ADD "0"
  ${EndIf}

  ${NSD_GetState} $hCtl_UrlProtocol $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_URL_PROTOCOL "1"
  ${Else}
    StrCpy $COMP_URL_PROTOCOL "0"
  ${EndIf}

  ; Startup
  ${NSD_GetState} $hCtl_McpAutostart $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $COMP_MCP_AUTOSTART "1"
  ${Else}
    StrCpy $COMP_MCP_AUTOSTART "0"
  ${EndIf}
FunctionEnd
