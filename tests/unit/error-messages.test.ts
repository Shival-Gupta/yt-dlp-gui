import { describe, it, expect } from 'vitest'
import { translateErrorMessage, ERROR_PATTERNS } from '../../src/lib/error-messages'

describe('Unit: translateErrorMessage', () => {
  it('should define at least 8 error pattern categories', () => {
    expect(ERROR_PATTERNS.length).toBeGreaterThanOrEqual(8)
  })

  it('should correctly identify age restriction error', () => {
    const raw = 'ERROR: [youtube] video123: Sign in to confirm your age. This video may be inappropriate.'
    const result = translateErrorMessage(raw)
    expect(result.category).toBe('age_restriction')
    expect(result.userMessage.toLowerCase()).toContain('age-restricted')
    expect(result.actionId).toBe('auth')
  })

  it('should correctly identify rate limiting', () => {
    const raw = 'ERROR: HTTP Error 429: Too Many Requests'
    const result = translateErrorMessage(raw)
    expect(result.category).toBe('rate_limited')
    expect(result.suggestedAction.toLowerCase()).toContain('proxy')
  })

  it('should correctly identify missing ffmpeg', () => {
    const raw = 'WARNING: ffmpeg not found! Media formats will not be merged.'
    const result = translateErrorMessage(raw)
    expect(result.category).toBe('ffmpeg_missing')
    expect(result.actionId).toBe('tools')
  })

  it('should fallback to generic advice on unknown errors', () => {
    const raw = 'Some random unmapped stderr line here'
    const result = translateErrorMessage(raw)
    expect(result.category).toBe('unknown')
    expect(result.userMessage).toContain('unexpected error')
    expect(result.suggestedAction).toContain('Log Panel')
  })
})
