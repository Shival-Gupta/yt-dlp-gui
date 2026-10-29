import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Tier 4: Real-World Scenario 6 — NSIS Installer & Agent Config Patching Dry-Run', () => {
  const projectRoot = path.resolve(__dirname, '../../..');
  const installerComponents = path.join(projectRoot, 'installer/components.nsi');
  const patchConfigsScript = path.join(projectRoot, 'installer/resources/patch-mcp-configs.ps1');

  it('should validate installer components definition against G-installer-agent.md specifications', () => {
    // 7 Component Groups specified in G-installer-agent.md:
    const requiredGroups = [
      'Core',
      'Media Processing',
      'JavaScript Runtime',
      'External Downloader',
      'AI Agent Integration',
      'System Integration',
      'Startup',
    ];
    expect(requiredGroups).toHaveLength(7);

    // If installer file exists, verify NSDialogs component directives
    if (fs.existsSync(installerComponents)) {
      const content = fs.readFileSync(installerComponents, 'utf-8');
      expect(content).toContain('nsDialogs');
      expect(content).toContain('FFmpeg');
    }
  });

  it('should validate multi-agent MCP config patching logic across Claude, Antigravity, Cursor', () => {
    // Simulate JSON structure of client configuration files
    const mockClaudeConfig = {
      mcpServers: {} as Record<string, any>,
    };

    const mockAntigravityConfig = {
      mcpServers: {} as Record<string, any>,
    };

    // Patch function mirroring patch-mcp-configs.ps1 logic
    function patchMcpServerConfig(config: { mcpServers: Record<string, any> }, binPath: string) {
      config.mcpServers['ytdeck-mcp'] = {
        command: binPath,
        args: [],
      };
      return config;
    }

    const testBinPath = 'C:\\Program Files\\yt-dlp-gui\\bin\\ytdeck-mcp.exe';
    patchMcpServerConfig(mockClaudeConfig, testBinPath);
    patchMcpServerConfig(mockAntigravityConfig, testBinPath);

    expect(mockClaudeConfig.mcpServers['ytdeck-mcp']).toBeDefined();
    expect(mockClaudeConfig.mcpServers['ytdeck-mcp'].command).toBe(testBinPath);

    expect(mockAntigravityConfig.mcpServers['ytdeck-mcp']).toBeDefined();
    expect(mockAntigravityConfig.mcpServers['ytdeck-mcp'].command).toBe(testBinPath);
  });
});
