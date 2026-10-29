import { describe, it, expect } from 'vitest';
import { buildMaskedCommandString, maskSensitiveArgs } from '../../helpers/cli-generator';

describe('Tier 2: Boundary & Corner Cases — Credential Masking (***)', () => {
  it('should mask basic authentication credentials (-u and -p)', () => {
    const rawArgs = ['-u', 'alice_secret', '-p', 'super_secret_password_123', 'https://example.com/video'];
    const masked = maskSensitiveArgs(rawArgs);

    expect(masked).toEqual(['-u', '***', '-p', '***', 'https://example.com/video']);
    expect(masked).not.toContain('alice_secret');
    expect(masked).not.toContain('super_secret_password_123');
  });

  it('should mask long-form authentication flags (--username and --password)', () => {
    const rawArgs = ['--username', 'user1', '--password', 'pass1', 'https://example.com/video'];
    const masked = maskSensitiveArgs(rawArgs);

    expect(masked).toEqual(['--username', '***', '--password', '***', 'https://example.com/video']);
    expect(masked).not.toContain('user1');
    expect(masked).not.toContain('pass1');
  });

  it('should mask video password, 2FA code, and TV account password', () => {
    const rawArgs = [
      '--video-password', 'vpass',
      '--twofactor', '987654',
      '--ap-password', 'tvpass',
      'https://example.com/video',
    ];
    const masked = maskSensitiveArgs(rawArgs);

    expect(masked).toEqual([
      '--video-password', '***',
      '--twofactor', '***',
      '--ap-password', '***',
      'https://example.com/video',
    ]);
    expect(masked).not.toContain('vpass');
    expect(masked).not.toContain('987654');
    expect(masked).not.toContain('tvpass');
  });

  it('should construct live command preview string without leaking plaintext credentials', () => {
    const cmd = buildMaskedCommandString({
      username: 'mySecretUser',
      password: 'mySecretPassword99',
      formatSelection: 'best',
      urls: ['https://youtube.com/watch?v=123'],
    });

    expect(cmd).toContain('yt-dlp');
    expect(cmd).toContain('-u ***');
    expect(cmd).toContain('-p ***');
    expect(cmd).toContain('-f best');
    expect(cmd).not.toContain('mySecretUser');
    expect(cmd).not.toContain('mySecretPassword99');
  });

  it('should never mask non-sensitive flags following sensitive ones', () => {
    const cmd = buildMaskedCommandString({
      password: 'mypassword',
      rateLimit: '5M',
      outputDir: 'C:\\Videos',
      urls: ['https://youtube.com/watch?v=123'],
    });

    expect(cmd).toContain('-p ***');
    expect(cmd).toContain('-r 5M');
    expect(cmd).toContain('-P C:\\Videos');
    expect(cmd).not.toContain('mypassword');
  });
});
