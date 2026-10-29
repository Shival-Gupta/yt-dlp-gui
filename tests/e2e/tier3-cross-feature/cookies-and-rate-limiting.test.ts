import { describe, it, expect } from 'vitest';
import { buildYtdlpArgs } from '../../helpers/cli-generator';

describe('Tier 3: Cross-Feature Combinations — Cookies Auth + Rate Limiting & Proxy', () => {
  it('should combine browser cookies extraction with proxy and bandwidth limits', () => {
    const options = {
      cookiesFromBrowser: 'chrome',
      proxy: 'http://127.0.0.1:8080',
      rateLimit: '3.5M',
      retries: 5,
      socketTimeout: 30,
      impersonate: 'chrome',
      urls: ['https://youtube.com/watch?v=protected123'],
    };

    const args = buildYtdlpArgs(options);

    // Auth / cookies flags
    expect(args).toContain('--cookies-from-browser');
    expect(args[args.indexOf('--cookies-from-browser') + 1]).toBe('chrome');

    // Network / proxy flags
    expect(args).toContain('--proxy');
    expect(args[args.indexOf('--proxy') + 1]).toBe('http://127.0.0.1:8080');
    expect(args).toContain('-r');
    expect(args[args.indexOf('-r') + 1]).toBe('3.5M');
    expect(args).toContain('-R');
    expect(args[args.indexOf('-R') + 1]).toBe('5');
    expect(args).toContain('--socket-timeout');
    expect(args[args.indexOf('--socket-timeout') + 1]).toBe('30');
    expect(args).toContain('--impersonate');
    expect(args[args.indexOf('--impersonate') + 1]).toBe('chrome');
  });

  it('should support netrc authentication alongside custom headers and socket timeout', () => {
    const options = {
      netrc: true,
      socketTimeout: 60,
      addHeaders: { Authorization: 'Bearer token123' },
      urls: ['https://example.com/stream'],
    };

    const args = buildYtdlpArgs(options);
    expect(args).toContain('--netrc');
    expect(args).toContain('--socket-timeout');
    expect(args).toContain('--add-header');
    expect(args).toContain('Authorization:Bearer token123');
  });
});
