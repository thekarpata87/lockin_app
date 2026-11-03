// Timestamp-based timing (SPEC §7): never count down with setInterval; always endAt − now.

export type Countdown = { remainingMs: number; done: boolean; fraction: number }

/** fraction: 1 at the start, 0 at the end. */
export function countdown(endAt: number, totalMs: number, now: number): Countdown {
  const remainingMs = Math.max(0, endAt - now)
  return { remainingMs, done: remainingMs === 0, fraction: totalMs > 0 ? remainingMs / totalMs : 0 }
}

/** Whole seconds shown on screen: rounds up so "1" shows until the very end. */
export const displaySeconds = (ms: number) => Math.ceil(ms / 1000)

/** "1:15", or "00:27" with pad. */
export function formatClock(totalSec: number, padMinutes = false): string {
  const s = Math.max(0, Math.round(totalSec))
  const m = Math.floor(s / 60)
  const r = String(s % 60).padStart(2, '0')
  return `${padMinutes ? String(m).padStart(2, '0') : m}:${r}`
}
