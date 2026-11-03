// Sunday step timers: several can run at once (rice + chicken). Timestamp-based, kept per device.
import { useSyncExternalStore } from 'react'

export type StepTimer = { endAt: number; totalMs: number }
type State = { week: string; timers: Record<string, StepTimer>; done: string[] }

const KEY = 'bloque.prep'
let state: State = read()
const subs = new Set<() => void>()

function read(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    // ignore
  }
  return { week: '', timers: {}, done: [] }
}

function write(s: State) {
  state = s
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // per-device convenience only
  }
  for (const f of subs) f()
}

const forWeek = (week: string): State => (state.week === week ? state : { week, timers: {}, done: [] })

export function usePrep(week: string): State {
  const s = useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => state,
  )
  return s.week === week ? s : { week, timers: {}, done: [] }
}

export function startStepTimer(week: string, stepId: string, minutes: number) {
  const s = forWeek(week)
  write({ ...s, timers: { ...s.timers, [stepId]: { endAt: Date.now() + minutes * 60_000, totalMs: minutes * 60_000 } } })
}

export function stopStepTimer(week: string, stepId: string) {
  const s = forWeek(week)
  const timers = { ...s.timers }
  delete timers[stepId]
  write({ ...s, timers })
}

export function toggleStepDone(week: string, stepId: string) {
  const s = forWeek(week)
  write({ ...s, done: s.done.includes(stepId) ? s.done.filter((x) => x !== stepId) : [...s.done, stepId] })
}
