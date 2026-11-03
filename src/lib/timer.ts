// Timestamp-based timing (SPEC §7): never count down with setInterval; always endAt − now.
import { CARDIO_BY_ID, CIRCUIT_B } from '../data/cardio'
import type { CardioKind, CardioSegment } from '../data/cardio'

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

// ---- Cardio timer engine (CASA) ----

export type PhaseKind = 'warmup' | 'work' | 'rest' | 'cooldown' | 'steady'

export type Phase = {
  kind: PhaseKind
  sec: number
  /** Display title: TRABAJO, DESCANSO, ZONA 2… */
  title: string
  /** Current exercise or what to do. */
  detail?: string
  cue?: string
  round?: number
  rounds?: number
}

const CIRCUIT_NAME = new Map(CIRCUIT_B.map((e) => [e.id, e]))

function expand(seg: CardioSegment, steadyOverrideSec?: number): Phase[] {
  switch (seg.kind) {
    case 'warmup':
      return [{ kind: 'warmup', sec: seg.sec, title: seg.label === 'Calentamiento' ? 'CALENTAMIENTO' : seg.label.toUpperCase() }]
    case 'cooldown':
      return [{ kind: 'cooldown', sec: seg.sec, title: seg.label === 'Enfriamiento' ? 'ENFRIAMIENTO' : seg.label.toUpperCase() }]
    case 'steady':
      return [{ kind: 'steady', sec: steadyOverrideSec ?? seg.sec, title: seg.label.toUpperCase() }]
    case 'circuit': {
      const out: Phase[] = []
      for (let r = 1; r <= seg.rounds; r++) {
        seg.exercises.forEach((id) => {
          const ex = CIRCUIT_NAME.get(id)
          out.push({ kind: 'work', sec: seg.workSec, title: 'TRABAJO', detail: ex?.name ?? id, cue: ex?.cue, round: r, rounds: seg.rounds })
          out.push({ kind: 'rest', sec: seg.restSec, title: 'DESCANSO', round: r, rounds: seg.rounds })
        })
      }
      return out
    }
    case 'intervals': {
      const out: Phase[] = []
      for (let r = 1; r <= seg.rounds; r++) {
        out.push({ kind: 'work', sec: seg.workSec, title: seg.workLabel.toUpperCase(), round: r, rounds: seg.rounds })
        out.push({ kind: 'rest', sec: seg.restSec, title: seg.restLabel.toUpperCase(), round: r, rounds: seg.rounds })
      }
      return out
    }
  }
}

/** Phases for a session. `minutes` overrides the length of steady sessions (Largo 45 or 60). */
export function buildPhases(kind: CardioKind, minutes?: number): Phase[] {
  const s = CARDIO_BY_ID.get(kind)
  if (!s) throw new Error(`Unknown cardio ${kind}`)
  const onlySteady = s.segments.length === 1 && s.segments[0]!.kind === 'steady'
  const phases = s.segments.flatMap((seg) => expand(seg, onlySteady && minutes ? minutes * 60 : undefined))
  // Rest phases show what comes next.
  phases.forEach((p, i) => {
    if (p.kind !== 'rest') return
    const next = phases[i + 1]
    if (next?.kind === 'work' && next.detail) p.detail = `Sigue: ${next.detail.toLowerCase()}`
  })
  if (onlySteady) phases[0]!.detail = s.description
  return phases
}

export const totalSec = (phases: Phase[]) => phases.reduce((s, p) => s + p.sec, 0)

/** All the engine needs; everything else is derived from Date.now(). */
export type TimerState = {
  startedAt: number
  /** ms spent paused (closed pauses). */
  pausedMs: number
  /** Set while paused. */
  pausedAt: number | null
  /** ms of program skipped with "Saltar". */
  skippedMs: number
}

export const startTimer = (now: number): TimerState => ({ startedAt: now, pausedMs: 0, pausedAt: null, skippedMs: 0 })

/** Time actually spent exercising (excludes pauses and skipped time). */
export const activeMs = (s: TimerState, now: number) => (s.pausedAt ?? now) - s.startedAt - s.pausedMs

export type TimerView = {
  index: number
  phase: Phase | undefined
  next: Phase | undefined
  remainingMs: number
  /** Position in the whole program. */
  programMs: number
  totalMs: number
  done: boolean
  paused: boolean
}

export function timerAt(phases: Phase[], s: TimerState, now: number): TimerView {
  const totalMs = totalSec(phases) * 1000
  const programMs = Math.min(totalMs, activeMs(s, now) + s.skippedMs)
  let acc = 0
  for (let i = 0; i < phases.length; i++) {
    const end = acc + phases[i]!.sec * 1000
    if (programMs < end) {
      return { index: i, phase: phases[i], next: phases[i + 1], remainingMs: end - programMs, programMs, totalMs, done: false, paused: s.pausedAt !== null }
    }
    acc = end
  }
  return { index: phases.length, phase: undefined, next: undefined, remainingMs: 0, programMs, totalMs, done: true, paused: s.pausedAt !== null }
}

export const pauseTimer = (s: TimerState, now: number): TimerState => (s.pausedAt !== null ? s : { ...s, pausedAt: now })

export const resumeTimer = (s: TimerState, now: number): TimerState =>
  s.pausedAt === null ? s : { ...s, pausedMs: s.pausedMs + (now - s.pausedAt), pausedAt: null }

/** Jump to the start of the next phase. */
export function skipPhase(phases: Phase[], s: TimerState, now: number): TimerState {
  const v = timerAt(phases, s, now)
  if (v.done) return s
  return { ...s, skippedMs: s.skippedMs + v.remainingMs }
}

/** Real minutes for the cardio log, capped at the program length (minus skipped time). */
export function realMinutes(phases: Phase[], s: TimerState, now: number): number {
  const cap = Math.max(0, totalSec(phases) * 1000 - s.skippedMs)
  return Math.round(Math.min(activeMs(s, now), cap) / 60_000)
}
