; ==============================================================================
; Download and Install FFmpeg & FFprobe Runtime
; Source: yt-dlp/FFmpeg-Builds (GPL win64 build)
; ==============================================================================

Section "FFmpeg & FFprobe Runtime" SEC_FFMPEG
  StrCmp $COMP_FFMPEG "1" 0 skip_ffmpeg

  DetailPrint "Downloading FFmpeg & FFprobe runtime from GitHub..."
  SetOutPath "$INSTDIR\bin"

  ; Use PowerShell to reliably handle TLS 1.3 and GitHub redirects to S3
  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "\
    `$ErrorActionPreference = ''Stop''; \
    try { \
      `$url = ''https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip''; \
      `$zipPath = Join-Path `$env:TEMP ''ffmpeg_install.zip''; \
      Write-Host ''Downloading FFmpeg package...''; \
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13; \
      Invoke-WebRequest -Uri `$url -OutFile `$zipPath -UseBasicParsing; \
      Write-Host ''Extracting ffmpeg and ffprobe...''; \
      `$extractDir = Join-Path `$env:TEMP ''ffmpeg_extracted''; \
      if (Test-Path `$extractDir) { Remove-Item `$extractDir -Recurse -Force }; \
      Expand-Archive -Path `$zipPath -DestinationPath `$extractDir -Force; \
      `$binFiles = Get-ChildItem -Path `$extractDir -Recurse -Filter ''*.exe'' | Where-Object { `$_.Name -in @(''ffmpeg.exe'', ''ffprobe.exe'') }; \
      `$targetDir = ''$INSTDIR\bin''; \
      if (-not (Test-Path `$targetDir)) { New-Item -ItemType Directory -Path `$targetDir -Force | Out-Null }; \
      foreach (`$file in `$binFiles) { \
        Copy-Item -Path `$file.FullName -Destination `$targetDir -Force; \
        Write-Host ('Installed ' + `$file.Name); \
      }; \
      Remove-Item `$zipPath -Force -ErrorAction SilentlyContinue; \
      Remove-Item `$extractDir -Recurse -Force -ErrorAction SilentlyContinue; \
    } catch { \
      Write-Error (`$_.Exception.Message); \
      exit 1; \
    }"'
  Pop $0

  ; Verify extraction success
  IfFileExists "$INSTDIR\bin\ffmpeg.exe" ffmpeg_success 0

  ; Non-blocking failure notice
  DetailPrint "Warning: FFmpeg download or extraction encountered an error (code $0)."
  MessageBox MB_ICONEXCLAMATION "FFmpeg download failed. yt-dlp GUI will still work, and you can download FFmpeg anytime from Settings."
  Goto done_ffmpeg

ffmpeg_success:
  DetailPrint "FFmpeg & FFprobe installed successfully to $INSTDIR\bin\"

done_ffmpeg:
skip_ffmpeg:
SectionEnd
