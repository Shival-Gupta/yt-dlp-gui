import { describe, it, expect } from 'vitest'
import { parseProgressLine } from '../../src/lib/progress-parser'

describe('progress-parser', () => {
  it('returns null for empty or non-progress lines', () => {
    expect(parseProgressLine('')).toBeNull()
    expect(parseProgressLine('   ')).toBeNull()
    expect(parseProgressLine('[info] Extracting URL: https://youtube.com/...')).toBeNull()
    expect(parseProgressLine('[youtube] Downloading webpage')).toBeNull()
  })

  it('parses JSON progress output correctly', () => {
    const jsonLine = JSON.stringify({
      status: 'downloading',
      downloaded: 5242880,
      total: 10485760,
      speed: 1048576,
      eta: 5,
      filename: 'video.mp4',
    })

    const parsed = parseProgressLine(jsonLine)
    expect(parsed).not.toBeNull()
    expect(parsed?.status).toBe('downloading')
    expect(parsed?.downloaded).toBe(5242880)
    expect(parsed?.total).toBe(10485760)
    expect(parsed?.speed).toBe(1048576)
    expect(parsed?.eta).toBe(5)
    expect(parsed?.filename).toBe('video.mp4')
    expect(parsed?.percent).toBe(50)
  })

  it('parses finished status in JSON progress', () => {
    const jsonLine = JSON.stringify({
      status: 'finished',
      downloaded: 10485760,
      total: 10485760,
      speed: 0,
      eta: 0,
      filename: 'video.mp4',
    })

    const parsed = parseProgressLine(jsonLine)
    expect(parsed).not.toBeNull()
    expect(parsed?.status).toBe('finished')
    expect(parsed?.percent).toBe(100)
  })

  it('parses standard [download] text progress line fallback', () => {
    const textLine = '[download]  45.2% of ~  50.00MiB at  2.50MiB/s ETA 00:11'
    const parsed = parseProgressLine(textLine)

    expect(parsed).not.toBeNull()
    expect(parsed?.status).toBe('downloading')
    expect(parsed?.percent).toBe(45.2)
    expect(parsed?.eta).toBe(11)
    expect(parsed?.speed).toBeGreaterThan(2000000)
    expect(parsed?.total).toBeGreaterThan(45000000)
  })

  it('parses [download] 100% completion text line', () => {
    const textLine = '[download] 100% of 10.00MiB in 00:03'
    const parsed = parseProgressLine(textLine)

    expect(parsed).not.toBeNull()
    expect(parsed?.status).toBe('finished')
    expect(parsed?.percent).toBe(100)
  })
})
