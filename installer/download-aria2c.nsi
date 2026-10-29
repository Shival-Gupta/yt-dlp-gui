; ==============================================================================
; Download and Install aria2c Multi-connection Accelerator
; Source: aria2/aria2 official release
; ==============================================================================

Section "aria2c" SEC_ARIA2
  StrCmp $COMP_ARIA2C "1" 0 skip_aria2

  DetailPrint "Downloading aria2c multi-connection download accelerator..."
  SetOutPath "$INSTDIR\bin"

  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "\
    `$ErrorActionPreference = ''Stop''; \
    try { \
      `$url = ''https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip''; \
      `$zipPath = Join-Path `$env:TEMP ''aria2_install.zip''; \
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13; \
      Invoke-WebRequest -Uri `$url -OutFile `$zipPath -UseBasicParsing; \
      `$extractDir = Join-Path `$env:TEMP ''aria2_extracted''; \
      if (Test-Path `$extractDir) { Remove-Item `$extractDir -Recurse -Force }; \
      Expand-Archive -Path `$zipPath -DestinationPath `$extractDir -Force; \
      `$exe = Get-ChildItem -Path `$extractDir -Recurse -Filter ''aria2c.exe'' | Select-Object -First 1; \
      if (`$exe) { \
        `$targetDir = ''$INSTDIR\bin''; \
        if (-not (Test-Path `$targetDir)) { New-Item -ItemType Directory -Path `$targetDir -Force | Out-Null }; \
        Copy-Item -Path `$exe.FullName -Destination (Join-Path `$targetDir ''aria2c.exe'') -Force; \
        Write-Host ''Installed aria2c.exe''; \
      } else { \
        throw ''aria2c.exe not found in archive''; \
      }; \
      Remove-Item `$zipPath -Force -ErrorAction SilentlyContinue; \
      Remove-Item `$extractDir -Recurse -Force -ErrorAction SilentlyContinue; \
    } catch { \
      Write-Error (`$_.Exception.Message); \
      exit 1; \
    }"'
  Pop $0

  IfFileExists "$INSTDIR\bin\aria2c.exe" aria2_success 0

  DetailPrint "Warning: aria2c download encountered an error (code $0)."
  MessageBox MB_ICONEXCLAMATION "aria2c download failed. yt-dlp GUI will use standard built-in download engine."
  Goto done_aria2

aria2_success:
  DetailPrint "aria2c installed successfully to $INSTDIR\bin\aria2c.exe"

done_aria2:
skip_aria2:
SectionEnd
