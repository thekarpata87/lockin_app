// The running cardio session, kept outside React (and in localStorage) so it survives
// tab switches and the app being closed and reopened.
import { useSyncExternalStore } from 'react'
import type { CardioKind } from '../../data/cardio'
import type { TimerState } from '../../lib/timer'

export type Run = { kind: CardioKind; minutes?: number; date: string; state: TimerState }

const KEY = 'bloque.cardioRun'
let current: Run | null = read()
const subs = new Set<() => void>()

function read(): Run | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Run) : null
  } catch {
    return null
  }
}

export function setRun(r: Run | null) {
  current = r
  try {
    if (r) localStorage.setItem(KEY, JSON.stringify(r))
    else localStorage.removeItem(KEY)
  } catch {
    // per-device convenience only
  }
  for (const s of subs) s()
}

export const getRun = () => current

export function useRun(): Run | null {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => current,
  )
}
