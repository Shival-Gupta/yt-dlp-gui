# Subagent H — CI/CD Agent

## Mission
Build the automated build and release pipeline. On every push to `main`, Windows x64 binaries are built. On every version tag (`v*`), a full release is published to GitHub Releases with the NSIS installer, both binaries, and a Tauri updater manifest.

## Context
- **Repo:** `d:\Projects\yt-ig-dowloader\yt-dlp-gui`
- **GitHub:** `https://github.com/Shival-Gupta/yt-dlp-gui`
- **Depends on:** Subagent G (Installer) — full installer must build successfully first
- **Platform:** GitHub Actions (ubuntu-latest runners for Linux builds; windows-latest for Windows)
- **Tauri build target:** Windows x64 only for v1.0

## Decisions (locked)
| Setting | Value |
|---|---|
| CI provider | GitHub Actions |
| Windows target | x86_64-pc-windows-msvc (x64) |
| Release trigger | `git tag v*` push |
| Tauri update server | GitHub raw file (updates/latest.json) |
| Node package manager | pnpm (v9) |
| Rust toolchain | stable |
| Artifacts | yt-dlp-gui.exe, ytdeck-mcp.exe, YTDeck-Setup-vX.X.X.exe |

## Ordered Task List (commit after each ✅)

### CI-INIT-01: Build workflow (on push to main)
Create `.github/workflows/build.yml`:
```yaml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-windows:
    name: Build Windows x64
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: x86_64-pc-windows-msvc

      - name: Rust cache
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri -> target

      - name: Install frontend deps
        run: pnpm install

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        with:
          tauriScript: pnpm tauri
          args: --target x86_64-pc-windows-msvc

      - name: Build MCP server
        run: cargo build --release -p ytdeck-mcp

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: windows-x64-build
          path: |
            src-tauri/target/x86_64-pc-windows-msvc/release/yt-dlp-gui.exe
            src-tauri/target/x86_64-pc-windows-msvc/release/ytdeck-mcp.exe
          retention-days: 7
```
Commit: `ci: add build workflow for Windows x64 on push to main`

### CI-RELEASE-01: Release workflow (on tag)
Create `.github/workflows/release.yml`:
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release-windows:
    name: Release Windows x64
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Rust cache
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri -> target

      - name: Install frontend deps
        run: pnpm install

      - name: Build and release with Tauri
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tauriScript: pnpm tauri
          tagName: ${{ github.ref_name }}
          releaseName: "yt-dlp GUI ${{ github.ref_name }}"
          releaseBody: |
            ## yt-dlp GUI ${{ github.ref_name }}
            
            See [CHANGELOG.md](https://github.com/Shival-Gupta/yt-dlp-gui/blob/main/CHANGELOG.md) for changes.
            
            ### Installation
            Download and run `YTDeck-Setup-*.exe`. Windows SmartScreen may warn — click "More info → Run anyway" (self-signed certificate).
            
            ### Requirements
            - Windows 10 1903+ (x64)
            - Internet connection during install (downloads FFmpeg, Deno)
          releaseDraft: false
          prerelease: false
          args: --target x86_64-pc-windows-msvc

      - name: Build MCP server
        run: cargo build --release -p ytdeck-mcp

      - name: Upload MCP server to release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            src-tauri/target/release/ytdeck-mcp.exe
          tag_name: ${{ github.ref_name }}
```
Commit: `ci: add release workflow for Windows x64 on version tag`

### CI-UPDATER-01: Tauri updater manifest
Create `updates/latest.json` (placeholder — CI will overwrite):
```json
{
  "version": "1.0.0",
  "notes": "Initial release",
  "pub_date": "2025-01-01T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/Shival-Gupta/yt-dlp-gui/releases/download/v1.0.0/YTDeck-Setup-v1.0.0.exe",
      "signature": ""
    }
  }
}
```

Add CI step to auto-generate and commit `updates/latest.json` after release:
```yaml
      - name: Update latest.json
        run: |
          $version = "${{ github.ref_name }}".TrimStart('v')
          $date = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
          $json = @{
            version = $version
            notes = "See GitHub release for details"
            pub_date = $date
            platforms = @{
              "windows-x86_64" = @{
                url = "https://github.com/Shival-Gupta/yt-dlp-gui/releases/download/${{ github.ref_name }}/YTDeck-Setup-${{ github.ref_name }}.exe"
                signature = ""
              }
            }
          } | ConvertTo-Json -Depth 5
          $json | Set-Content "updates/latest.json" -Encoding UTF8
        shell: pwsh

      - name: Commit updated latest.json
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update updates/latest.json for ${{ github.ref_name }}"
          file_pattern: updates/latest.json
          branch: main
```
Commit: `ci: add Tauri updater manifest generation on release`

### CI-CACHE-01: Optimize build caching
Add caching for:
1. Rust target directory (Swatinem/rust-cache already in workflow)
2. pnpm store (via setup-node cache)
3. yt-dlp sidecar binary (check if it changed since last build):
   ```yaml
         - name: Cache yt-dlp sidecar
           uses: actions/cache@v4
           with:
             path: src-tauri/binaries/yt-dlp-x86_64-pc-windows-msvc.exe
             key: ytdlp-sidecar-${{ hashFiles('src-tauri/binaries/yt-dlp-version.txt') }}
   ```

Commit: `ci: add build caching for Rust, pnpm, and yt-dlp sidecar`

### CI-LINT-01: Lint and type-check workflow
Create `.github/workflows/lint.yml`:
```yaml
name: Lint

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm type-check     # tsc --noEmit
      - run: pnpm lint           # eslint

  rust-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - run: cargo fmt --all -- --check
      - run: cargo clippy --all-targets --all-features -- -D warnings
```
Add the scripts to `package.json`:
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0"
  }
}
```
Commit: `ci: add lint and type-check workflow`

### CI-TEST-01: Frontend unit test workflow
Create `.github/workflows/test.yml`:
```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm test -- --run   # Vitest in CI mode

  mcp-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo test -p ytdeck-mcp
```
Add Vitest to `package.json` dev deps:
```powershell
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```
Add `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```
Commit: `ci: add frontend Vitest and Rust unit test workflows`

### CI-DEPENDABOT-01: Dependency update automation
Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    labels: ["dependencies", "frontend"]

  - package-ecosystem: "cargo"
    directory: "/"
    schedule:
      interval: "weekly"
    labels: ["dependencies", "rust"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels: ["dependencies", "ci"]
```
Commit: `ci: add Dependabot for automatic dependency updates`

### CI-SIDECAR-AUTO-01: Automatic yt-dlp sidecar update workflow
Create `.github/workflows/update-ytdlp.yml`:
```yaml
name: Update yt-dlp Sidecar

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2am UTC
  workflow_dispatch:       # Allow manual trigger

jobs:
  update-ytdlp:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get latest yt-dlp version
        id: ytdlp-version
        run: |
          $release = Invoke-RestMethod "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest"
          echo "version=$($release.tag_name)" >> $env:GITHUB_OUTPUT
        shell: pwsh

      - name: Check current sidecar version
        id: current-version
        run: |
          if (Test-Path "src-tauri/binaries/yt-dlp-version.txt") {
            $v = Get-Content "src-tauri/binaries/yt-dlp-version.txt"
            echo "version=$v" >> $env:GITHUB_OUTPUT
          } else {
            echo "version=none" >> $env:GITHUB_OUTPUT
          }
        shell: pwsh

      - name: Download updated yt-dlp
        if: steps.ytdlp-version.outputs.version != steps.current-version.outputs.version
        run: |
          $version = "${{ steps.ytdlp-version.outputs.version }}"
          $url = "https://github.com/yt-dlp/yt-dlp/releases/download/$version/yt-dlp.exe"
          Invoke-WebRequest $url -OutFile "src-tauri/binaries/yt-dlp-x86_64-pc-windows-msvc.exe"
          $version | Set-Content "src-tauri/binaries/yt-dlp-version.txt"
        shell: pwsh

      - name: Commit updated sidecar
        if: steps.ytdlp-version.outputs.version != steps.current-version.outputs.version
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore(sidecar): update yt-dlp to ${{ steps.ytdlp-version.outputs.version }}"
          file_pattern: "src-tauri/binaries/yt-dlp-x86_64-pc-windows-msvc.exe src-tauri/binaries/yt-dlp-version.txt"
```
Commit: `ci: add weekly yt-dlp sidecar auto-update workflow`

### CI-BADGE-01: README badges
Update `README.md`:
```markdown
# yt-dlp GUI

[![Build](https://github.com/Shival-Gupta/yt-dlp-gui/actions/workflows/build.yml/badge.svg)](https://github.com/Shival-Gupta/yt-dlp-gui/actions/workflows/build.yml)
[![Release](https://img.shields.io/github/v/release/Shival-Gupta/yt-dlp-gui?label=Latest%20Release&style=flat)](https://github.com/Shival-Gupta/yt-dlp-gui/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20x64-blue.svg)](#)
[![yt-dlp](https://img.shields.io/badge/powered%20by-yt--dlp-red.svg)](https://github.com/yt-dlp/yt-dlp)
```
Commit: `docs: add CI/CD status badges to README`

### CI-VALIDATE-01: Verify end-to-end pipeline
1. Push a test tag: `git tag v0.1.0-test && git push --tags`
2. Verify release workflow runs and produces:
   - `YTDeck-Setup-v0.1.0-test.exe` as GitHub Release asset
   - `ytdeck-mcp.exe` as GitHub Release asset
   - `updates/latest.json` updated in repo
3. Delete test release and tag after verification

Commit: `test: verify end-to-end release pipeline with v0.1.0-test`

## Definition of Done
- [ ] `build.yml` — builds on every push to main, artifacts uploaded
- [ ] `release.yml` — publishes GitHub Release on tag, includes NSIS installer + MCP binary
- [ ] `lint.yml` — ESLint + TypeScript + Cargo clippy
- [ ] `test.yml` — Vitest + Rust unit tests
- [ ] `update-ytdlp.yml` — weekly auto-update of yt-dlp sidecar
- [ ] `dependabot.yml` — weekly dep updates for npm, cargo, GitHub Actions
- [ ] `updates/latest.json` — auto-updated on release
- [ ] README has build/release badges
- [ ] End-to-end release pipeline verified with test tag
- [ ] All commits pushed to `main`
