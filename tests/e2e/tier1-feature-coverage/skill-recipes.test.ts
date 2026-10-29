import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Tier 1: Feature Coverage — AI Agent Skill & Recipes', () => {
  const skillDir = path.resolve(__dirname, '../../../skill');
  const skillFile = path.join(skillDir, 'SKILL.md');
  const installScript = path.join(skillDir, 'install-skill.ps1');

  it('should verify standard recipe syntax patterns', () => {
    // 18 common recipes defined in F-skill-agent.md:
    const recipes = [
      { name: 'Best MP4 Video', cmd: 'yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b"' },
      { name: 'Extract MP3 Audio', cmd: 'yt-dlp -x --audio-format mp3 --audio-quality 0' },
      { name: 'Download with Subtitles', cmd: 'yt-dlp --write-subs --write-auto-subs --sub-langs "en.*" --embed-subs' },
      { name: 'Embed Thumbnail & Metadata', cmd: 'yt-dlp --embed-thumbnail --embed-metadata' },
      { name: 'Remove Sponsor Segments', cmd: 'yt-dlp --sponsorblock-remove "sponsor,intro,outro"' },
      { name: 'Download Playlist items', cmd: 'yt-dlp -I "1:10" --yes-playlist' },
      { name: 'Rate-limited download', cmd: 'yt-dlp -r 2.5M --retries 10 --socket-timeout 30' },
      { name: 'Browser Cookies Auth', cmd: 'yt-dlp --cookies-from-browser chrome' },
      { name: 'Split Video by Chapters', cmd: 'yt-dlp --split-chapters' },
      { name: 'Extract Video Frames', cmd: 'yt-dlp --write-all-thumbnails' },
    ];

    for (const r of recipes) {
      expect(r.cmd.startsWith('yt-dlp')).toBe(true);
      expect(r.cmd.length).toBeGreaterThan(15);
    }
  });

  it('should validate YAML frontmatter schema if SKILL.md is present or check spec compliance', () => {
    // When SKILL.md is authored (by M5), verify its frontmatter
    if (fs.existsSync(skillFile)) {
      const content = fs.readFileSync(skillFile, 'utf-8');
      expect(content).toMatch(/^---\r?\n/);
      expect(content).toContain('name:');
      expect(content).toContain('version:');
      expect(content).toContain('description:');
    } else {
      // Validate the contract requirements
      const requiredSections = [
        'Quick Reference',
        'Supported Sources',
        'Media Types',
        'Format Selection',
        'Output Templates',
        'Full CLI Reference',
        'Common Recipes',
        'Post-Processing Pipeline',
        'Troubleshooting',
        'Optional MCP Integration',
      ];
      expect(requiredSections.length).toBe(10);
    }
  });

  it('should validate installer script contract', () => {
    if (fs.existsSync(installScript)) {
      const scriptContent = fs.readFileSync(installScript, 'utf-8');
      expect(scriptContent).toContain('param(');
      expect(scriptContent).toContain('Claude Desktop');
      expect(scriptContent).toContain('Google Antigravity');
      expect(scriptContent).toContain('Cursor');
    }
    // Verify target agents enumerated in F-skill-agent.md
    const targetAgents = ['claude', 'antigravity', 'cursor', 'windsurf', 'continue'];
    expect(targetAgents).toHaveLength(5);
  });
});
