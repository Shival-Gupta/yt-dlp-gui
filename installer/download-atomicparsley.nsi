; ==============================================================================
; Download and Install AtomicParsley Metadata Tagger
; Source: wez/atomicparsley release
; ==============================================================================

Section "AtomicParsley" SEC_AP
  StrCmp $COMP_ATOMICPARSLEY "1" 0 skip_ap

  DetailPrint "Downloading AtomicParsley metadata tagger..."
  SetOutPath "$INSTDIR\bin"

  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "\
    `$ErrorActionPreference = ''Stop''; \
    try { \
      `$url = ''https://github.com/wez/atomicparsley/releases/download/20210715.151551.e7ad03a/AtomicParsley-windows-x86_64.zip''; \
      `$zipPath = Join-Path `$env:TEMP ''ap_install.zip''; \
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13; \
      Invoke-WebRequest -Uri `$url -OutFile `$zipPath -UseBasicParsing; \
      `$extractDir = Join-Path `$env:TEMP ''ap_extracted''; \
      if (Test-Path `$extractDir) { Remove-Item `$extractDir -Recurse -Force }; \
      Expand-Archive -Path `$zipPath -DestinationPath `$extractDir -Force; \
      `$exe = Get-ChildItem -Path `$extractDir -Recurse -Filter ''AtomicParsley.exe'' | Select-Object -First 1; \
      if (`$exe) { \
        `$targetDir = ''$INSTDIR\bin''; \
        if (-not (Test-Path `$targetDir)) { New-Item -ItemType Directory -Path `$targetDir -Force | Out-Null }; \
        Copy-Item -Path `$exe.FullName -Destination (Join-Path `$targetDir ''AtomicParsley.exe'') -Force; \
        Write-Host ''Installed AtomicParsley.exe''; \
      } else { \
        throw ''AtomicParsley.exe not found in archive''; \
      }; \
      Remove-Item `$zipPath -Force -ErrorAction SilentlyContinue; \
      Remove-Item `$extractDir -Recurse -Force -ErrorAction SilentlyContinue; \
    } catch { \
      Write-Error (`$_.Exception.Message); \
      exit 1; \
    }"'
  Pop $0

  IfFileExists "$INSTDIR\bin\AtomicParsley.exe" ap_success 0

  DetailPrint "Warning: AtomicParsley download encountered an error (code $0)."
  MessageBox MB_ICONEXCLAMATION "AtomicParsley download failed. MP4/M4A tagging may be performed with fallback tools."
  Goto done_ap

ap_success:
  DetailPrint "AtomicParsley installed successfully to $INSTDIR\bin\AtomicParsley.exe"

done_ap:
skip_ap:
SectionEnd
