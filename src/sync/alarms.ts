// Things that will end soon (cardio, rest, Sunday steps). sync/push.ts mirrors them to the server.
// Kept dependency-free so screens can import it cheaply.
export type Alarm = { at: number; title: string; body: string }

export const alarms = new Map<string, Alarm>()

type Listener = (tag: string, alarm: Alarm | null) => void
const listeners = new Set<Listener>()
export const onAlarmChange = (fn: Listener) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setAlarm(tag: string, at: number, title: string, body: string) {
  const prev = alarms.get(tag)
  // Same end time (±1 s): nothing to do.
  if (prev && Math.abs(prev.at - at) < 1000 && prev.title === title) return
  const a = { at, title, body }
  alarms.set(tag, a)
  listeners.forEach((l) => l(tag, a))
}

export function clearAlarm(tag: string) {
  if (!alarms.delete(tag)) return
  listeners.forEach((l) => l(tag, null))
}
