import { describe, expect, it } from 'vitest'
import { buildPhases, countdown, displaySeconds, formatClock, pauseTimer, realMinutes, resumeTimer, skipPhase, startTimer, timerAt, totalSec } from './timer'

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

describe('cardio phases', () => {
  it('A, B and C last 40 min; Largo can be 60', () => {
    for (const k of ['A', 'B', 'C'] as const) expect(totalSec(buildPhases(k))).toBe(2400)
    expect(totalSec(buildPhases('largo'))).toBe(45 * 60)
    expect(totalSec(buildPhases('largo', 60))).toBe(60 * 60)
  })

  it('B: warmup, 5 rounds × 6 × (40 work / 20 rest), cooldown; rest shows what is next', () => {
    const p = buildPhases('B')
    expect(p).toHaveLength(1 + 60 + 1)
    expect(p[1]).toMatchObject({ kind: 'work', sec: 40, title: 'TRABAJO', detail: 'Sentadilla a silla', round: 1, rounds: 5 })
    expect(p[2]).toMatchObject({ kind: 'rest', sec: 20, detail: 'Sigue: subir escalón' })
    expect(p[60]).toMatchObject({ kind: 'rest', round: 5 })
    expect(p[61]).toMatchObject({ kind: 'cooldown', title: 'ENFRIAMIENTO' })
  })

  it('C: 8 × (30 fuerte / 90 suave) between warmup, cooldown and zone 2', () => {
    const p = buildPhases('C')
    expect(p.map((x) => x.title).slice(0, 3)).toEqual(['SUAVE', 'FUERTE', 'SUAVE'])
    expect(p[p.length - 1]).toMatchObject({ kind: 'steady', sec: 840, title: 'ZONA 2' })
  })
})

describe('timer engine', () => {
  const B = buildPhases('B')
  const t0 = 1_000_000

  it('screen off for 20 s: resumes at the right phase, skipping expired ones', () => {
    const s = startTimer(t0)
    // 5:00 warmup + 40 s work + 15 s into rest
    const v = timerAt(B, s, t0 + (300 + 40 + 15) * 1000)
    expect(v.index).toBe(2)
    expect(v.phase?.kind).toBe('rest')
    expect(v.remainingMs).toBe(5000)
    // 20 s later, without any tick in between
    const w = timerAt(B, s, t0 + (300 + 40 + 35) * 1000)
    expect(w.index).toBe(3)
    expect(w.phase?.detail).toBe('Subir escalón')
    expect(w.remainingMs).toBe(25_000)
  })

  it('pause freezes time; resume continues', () => {
    let s = startTimer(t0)
    s = pauseTimer(s, t0 + 10_000)
    expect(timerAt(B, s, t0 + 70_000).remainingMs).toBe(290_000)
    s = resumeTimer(s, t0 + 70_000)
    expect(timerAt(B, s, t0 + 75_000).remainingMs).toBe(285_000)
    expect(realMinutes(B, s, t0 + 75_000)).toBe(0)
  })

  it('skip jumps to the next phase and does not count as exercise', () => {
    let s = startTimer(t0)
    s = skipPhase(B, s, t0 + 1000)
    const v = timerAt(B, s, t0 + 1000)
    expect(v.index).toBe(1)
    expect(v.remainingMs).toBe(40_000)
    expect(realMinutes(B, s, t0 + 1000)).toBe(0)
  })

  it('done after the last phase', () => {
    const s = startTimer(t0)
    const v = timerAt(B, s, t0 + 2400_000 + 5000)
    expect(v.done).toBe(true)
    expect(v.programMs).toBe(2400_000)
    // reopened hours later: still 40 min
    expect(realMinutes(B, s, t0 + 5 * 3600_000)).toBe(40)
  })
})
