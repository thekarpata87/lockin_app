// Things that will end soon (cardio, rest, Sunday steps). sync/push.ts sends them to the server
// only when the app is hidden. Kept dependency-free so screens can import it cheaply.
export type Alarm = { at: number; title: string; body: string }

export const alarms = new Map<string, Alarm>()

export function setAlarm(tag: string, at: number, title: string, body: string) {
  alarms.set(tag, { at, title, body })
}

export const clearAlarm = (tag: string) => void alarms.delete(tag)
