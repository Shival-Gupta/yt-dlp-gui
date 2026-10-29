import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Milestone 6: Windows NSIS Installer & CI/CD Verification Suite', () => {
  const root = path.resolve(__dirname, '../..')

  describe('NSIS Installer Script Infrastructure', () => {
    const installerDir = path.join(root, 'installer')

    it('should have all required NSIS installer scripts present', () => {
      const requiredFiles = [
        'installer.nsi',
        'components.nsi',
        'download-ffmpeg.nsi',
        'download-deno.nsi',
        'download-atomicparsley.nsi',
        'download-aria2c.nsi',
        'SIGNING.md',
        'TEST-RESULTS.md',
        'dev-signing.pfx',
      ]

      for (const file of requiredFiles) {
        const filePath = path.join(installerDir, file)
        expect(fs.existsSync(filePath), `Expected ${file} to exist in installer/`).toBe(true)
        const stat = fs.statSync(filePath)
        expect(stat.size, `Expected ${file} to have non-zero size`).toBeGreaterThan(0)
      }
    })

    it('should have all installer resource assets present in installer/resources/', () => {
      const resourcesDir = path.join(installerDir, 'resources')
      const requiredResources = [
        'patch-mcp-configs.ps1',
        'install-skill.ps1',
        'SKILL.md',
        'app.ico',
        'header.bmp',
      ]

      for (const res of requiredResources) {
        const resPath = path.join(resourcesDir, res)
        expect(fs.existsSync(resPath), `Expected ${res} in installer/resources/`).toBe(true)
        const stat = fs.statSync(resPath)
        expect(stat.size, `Expected ${res} to have non-zero size`).toBeGreaterThan(0)
      }
    })

    it('should define custom NSDialogs component selection with all 7 groups and 12+ checkboxes', () => {
      const componentsNsi = fs.readFileSync(path.join(installerDir, 'components.nsi'), 'utf-8')

      // Group Directives
      expect(componentsNsi).toContain('1. Core Application')
      expect(componentsNsi).toContain('2. Media Processing')
      expect(componentsNsi).toContain('3. JavaScript Runtime')
      expect(componentsNsi).toContain('4. External Downloader')
      expect(componentsNsi).toContain('5. AI Agent Integration')
      expect(componentsNsi).toContain('6. Windows System Integration')
      expect(componentsNsi).toContain('7. Background Startup')

      // Key Component variables
      expect(componentsNsi).toContain('COMP_CORE_APP')
      expect(componentsNsi).toContain('COMP_FFMPEG')
      expect(componentsNsi).toContain('COMP_ATOMICPARSLEY')
      expect(componentsNsi).toContain('COMP_DENO')
      expect(componentsNsi).toContain('COMP_NODE')
      expect(componentsNsi).toContain('COMP_JS_SKIP')
      expect(componentsNsi).toContain('COMP_ARIA2C')
      expect(componentsNsi).toContain('COMP_MCP_SERVER')
      expect(componentsNsi).toContain('COMP_AI_SKILL')
      expect(componentsNsi).toContain('COMP_START_MENU')
      expect(componentsNsi).toContain('COMP_DESKTOP_SC')
      expect(componentsNsi).toContain('COMP_CONTEXT_MENU')
      expect(componentsNsi).toContain('COMP_PATH_ADD')
      expect(componentsNsi).toContain('COMP_URL_PROTOCOL')
      expect(componentsNsi).toContain('COMP_MCP_AUTOSTART')
    })

    it('should configure Windows shell integrations and clean uninstaller in installer.nsi', () => {
      const installerNsi = fs.readFileSync(path.join(installerDir, 'installer.nsi'), 'utf-8')

      // Context menu
      expect(installerNsi).toContain('Software\\Classes\\*\\shell\\YtdlpGUI')
      expect(installerNsi).toContain('Software\\Classes\\Directory\\shell\\YtdlpGUI')

      // Protocol handler
      expect(installerNsi).toContain('Software\\Classes\\ytdeck')

      // PATH registration
      expect(installerNsi).toContain('PATH')

      // Autostart key
      expect(installerNsi).toContain('Software\\Microsoft\\Windows\\CurrentVersion\\Run')

      // Uninstaller sections & user history prompt
      expect(installerNsi).toContain('Section "Uninstall"')
      expect(installerNsi).toContain('com.shival-gupta.yt-dlp-gui')
    })
  })

  describe('CI/CD Pipelines and Release Delivery', () => {
    const workflowsDir = path.join(root, '.github/workflows')

    it('should have all 5 GitHub Actions workflows and dependabot config present', () => {
      const requiredWorkflows = [
        'build.yml',
        'release.yml',
        'lint.yml',
        'test.yml',
        'update-ytdlp.yml',
      ]

      for (const wf of requiredWorkflows) {
        const wfPath = path.join(workflowsDir, wf)
        expect(fs.existsSync(wfPath), `Expected workflow ${wf} to exist`).toBe(true)
      }

      const dependabotPath = path.join(root, '.github/dependabot.yml')
      expect(fs.existsSync(dependabotPath), 'Expected dependabot.yml to exist').toBe(true)
    })

    it('should validate build.yml configuration for Windows x64 and artifact upload', () => {
      const buildYml = fs.readFileSync(path.join(workflowsDir, 'build.yml'), 'utf-8')
      expect(buildYml).toContain('windows-latest')
      expect(buildYml).toContain('x86_64-pc-windows-msvc')
      expect(buildYml).toContain('actions/upload-artifact@v4')
      expect(buildYml).toContain('retention-days: 7')
    })

    it('should validate release.yml configuration for tags and updater manifest synthesis', () => {
      const releaseYml = fs.readFileSync(path.join(workflowsDir, 'release.yml'), 'utf-8')
      expect(releaseYml).toContain("tags:\n      - 'v*'")
      expect(releaseYml).toContain('tauri-apps/tauri-action')
      expect(releaseYml).toContain('updates/latest.json')
      expect(releaseYml).toContain('git-auto-commit-action')
    })

    it('should validate updater manifest updates/latest.json structure', () => {
      const latestJsonPath = path.join(root, 'updates/latest.json')
      expect(fs.existsSync(latestJsonPath)).toBe(true)

      const manifest = JSON.parse(fs.readFileSync(latestJsonPath, 'utf-8'))
      expect(manifest.version).toBeDefined()
      expect(manifest.platforms['windows-x86_64']).toBeDefined()
      expect(manifest.platforms['windows-x86_64'].url).toContain('https://github.com/Shival-Gupta/yt-dlp-gui/releases')
    })
  })
})
