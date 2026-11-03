// Rest timer state lives outside React so it survives switching tabs. Timestamp-based (SPEC §7).
import { useSyncExternalStore } from 'react'
import { clearAlarm, setAlarm } from '../../sync/alarms'

export type Rest = { sessionId: string; endAt: number; totalMs: number }

const KEY = 'bloque.rest'
let current: Rest | null = read()
const subs = new Set<() => void>()

function read(): Rest | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Rest) : null
  } catch {
    return null
  }
}

function write(r: Rest | null) {
  current = r
  try {
    if (r) localStorage.setItem(KEY, JSON.stringify(r))
    else localStorage.removeItem(KEY)
  } catch {
    // per-device convenience only
  }
  for (const s of subs) s()
}

export function startRest(sessionId: string, sec: number, now = Date.now()) {
  const endAt = now + sec * 1000
  write({ sessionId, endAt, totalMs: sec * 1000 })
  setAlarm('rest', endAt, 'Descanso terminado', 'Siguiente serie.')
}
export function stopRest() {
  write(null)
  clearAlarm('rest')
}

export function useRest(): Rest | null {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => current,
  )
}
