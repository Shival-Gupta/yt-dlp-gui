; ==============================================================================
; Download and Install Deno JavaScript Runtime
; Source: denoland/deno latest release
; ==============================================================================

Section "Deno JavaScript Runtime" SEC_DENO
  StrCmp $COMP_DENO "1" 0 skip_deno

  DetailPrint "Downloading Deno JavaScript runtime from GitHub..."
  SetOutPath "$INSTDIR\bin"

  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "\
    `$ErrorActionPreference = ''Stop''; \
    try { \
      `$url = ''https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip''; \
      `$zipPath = Join-Path `$env:TEMP ''deno_install.zip''; \
      Write-Host ''Downloading Deno package...''; \
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13; \
      Invoke-WebRequest -Uri `$url -OutFile `$zipPath -UseBasicParsing; \
      Write-Host ''Extracting deno.exe...''; \
      `$extractDir = Join-Path `$env:TEMP ''deno_extracted''; \
      if (Test-Path `$extractDir) { Remove-Item `$extractDir -Recurse -Force }; \
      Expand-Archive -Path `$zipPath -DestinationPath `$extractDir -Force; \
      `$exe = Get-ChildItem -Path `$extractDir -Recurse -Filter ''deno.exe'' | Select-Object -First 1; \
      if (`$exe) { \
        `$targetDir = ''$INSTDIR\bin''; \
        if (-not (Test-Path `$targetDir)) { New-Item -ItemType Directory -Path `$targetDir -Force | Out-Null }; \
        Copy-Item -Path `$exe.FullName -Destination (Join-Path `$targetDir ''deno.exe'') -Force; \
        Write-Host ''Installed deno.exe''; \
      } else { \
        throw ''deno.exe not found in archive''; \
      }; \
      Remove-Item `$zipPath -Force -ErrorAction SilentlyContinue; \
      Remove-Item `$extractDir -Recurse -Force -ErrorAction SilentlyContinue; \
    } catch { \
      Write-Error (`$_.Exception.Message); \
      exit 1; \
    }"'
  Pop $0

  IfFileExists "$INSTDIR\bin\deno.exe" deno_success 0

  DetailPrint "Warning: Deno runtime download encountered an error (code $0)."
  MessageBox MB_ICONEXCLAMATION "Deno download failed. YouTube signature deciphering may be limited until a JS runtime is configured."
  Goto done_deno

deno_success:
  DetailPrint "Deno runtime installed successfully to $INSTDIR\bin\deno.exe"

done_deno:
skip_deno:
SectionEnd
