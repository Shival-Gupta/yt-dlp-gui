import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { translateErrorMessage } from '../../helpers/error-translator';

describe('Tier 2: Boundary & Corner Cases — Error Mapping & Translation', () => {
  const fixturePath = path.resolve(__dirname, '../../fixtures/error_samples.json');
  const samples = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

  it('should translate all 8 core error categories from fixture samples', () => {
    expect(samples.length).toBe(8);

    for (const sample of samples) {
      const translated = translateErrorMessage(sample.raw_stderr);

      expect(translated.category).toBe(sample.category);
      expect(translated.userMessage.toLowerCase()).toContain(sample.expected_message_substring.toLowerCase());
      expect(translated.suggestedAction).toBeTruthy();
    }
  });

  it('should fall back to generic advice for unknown raw errors', () => {
    const unknownError = 'ERROR: [custom_extractor] Something weird occurred on line 42';
    const translated = translateErrorMessage(unknownError);

    expect(translated.category).toBe('unknown');
    expect(translated.userMessage).toContain('unexpected error');
    expect(translated.suggestedAction).toContain('Log Panel');
  });
});
