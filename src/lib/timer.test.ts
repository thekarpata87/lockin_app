import { describe, expect, it } from 'vitest'
import { countdown, displaySeconds, formatClock } from './timer'

describe('countdown', () => {
  it('derives everything from timestamps, so a frozen app shows the right time', () => {
    const start = 1_000_000
    const end = start + 75_000
    expect(countdown(end, 75_000, start)).toEqual({ remainingMs: 75_000, done: false, fraction: 1 })
    // the phone slept for 20 s
    expect(countdown(end, 75_000, start + 20_000).remainingMs).toBe(55_000)
    expect(countdown(end, 75_000, end + 5_000)).toEqual({ remainingMs: 0, done: true, fraction: 0 })
  })

  it('display rounding and formatting', () => {
    expect(displaySeconds(54_001)).toBe(55)
    expect(displaySeconds(0)).toBe(0)
    expect(formatClock(75)).toBe('1:15')
    expect(formatClock(27, true)).toBe('00:27')
  })
})
