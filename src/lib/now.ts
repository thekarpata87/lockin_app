// "Ahora": the day's schedule adjusted for weekends and the gradual sleep ramp, and the current/next item.
import { HOME_CARDIO_WEEK } from '../data/cardio'
import type { CardioKind } from '../data/cardio'
import { GYM_DAY_BY_KEY } from '../data/routines'
import type { GymDayKey } from '../data/routines'
import { SLEEP_RAMP, WEEKDAY_SCHEDULE } from '../data/schedule'
import type { ScheduleItem, SleepRampStep } from '../data/schedule'
import type { DayKey } from '../data/types'
import { daysBetween } from './dates'

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
export const fromMin = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export type SleepOpts = { wakeTime: string; sleepTime: string; sleepRamp: boolean; sleepRampStart: string | null }

/** Active ramp step for `date`, or null when the ramp is off or finished. */
export function rampStep(s: SleepOpts, date: string): SleepRampStep | null {
  if (!s.sleepRamp || !s.sleepRampStart) return null
  const night = daysBetween(s.sleepRampStart, date) + 1
  if (night < 1) return null
  const step = [...SLEEP_RAMP].reverse().find((r) => night >= r.fromNight) ?? null
  return step && step.fromNight < 7 ? step : null
}

export type DayItem = ScheduleItem & { detail?: string; cardioKind?: CardioKind }

export function scheduleFor(dayKey: DayKey, date: string, s: SleepOpts): DayItem[] {
  const ramp = rampStep(s, date)
  const wake = ramp?.wake ?? s.wakeTime
  const sleep = ramp?.sleep ?? s.sleepTime
  const gymStart = ramp?.gym.start ?? '06:00'
  const gymEnd = ramp?.gym.end ?? '07:15'
  const postMin = ramp?.note ? 10 : 25
  const cardio = HOME_CARDIO_WEEK[dayKey]

  const items: DayItem[] = []
  for (const it of WEEKDAY_SCHEDULE) {
    switch (it.id) {
      case 'wake':
        items.push({ ...it, start: wake })
        break
      case 'pre':
        items.push({ ...it, start: fromMin(toMin(wake) + 5) })
        break
      case 'gym': {
        if (dayKey === 'sab' || dayKey === 'dom') {
          if (dayKey === 'sab') {
            items.push({ id: 'homeCardio', start: gymStart, label: 'Cardio Largo (o B)', kind: 'cardio', cardio: 'home', cardioKind: 'largo' })
          }
          break
        }
        const day = GYM_DAY_BY_KEY.get(dayKey as GymDayKey)
        items.push({ ...it, start: gymStart, end: gymEnd, detail: day?.title })
        break
      }
      case 'gymCardio':
        if (dayKey === 'sab' || dayKey === 'dom') break
        items.push({ ...it, start: gymEnd, end: fromMin(toMin(gymEnd) + postMin), detail: `${postMin} min` })
        break
      case 'homeCardio':
        if (dayKey === 'sab' || dayKey === 'dom' || !cardio.main) break
        items.push({ ...it, cardioKind: cardio.main })
        break
      case 'trabajo':
        if (dayKey === 'sab' || dayKey === 'dom') break
        items.push(it)
        break
      case 'sleep':
        items.push({ ...it, start: sleep })
        break
      default:
        items.push(it)
    }
  }
  if (dayKey === 'dom') {
    items.push({ id: 'walk', start: '17:00', label: 'Descanso activo: caminata ligera', kind: 'habito' })
  }
  return items.sort((a, b) => toMin(a.start) - toMin(b.start))
}

const GRACE_MIN = 45

/**
 * Current item (within its window, or up to 45 min after a point-in-time item), else the next one.
 * Work hours are skipped: meals during work matter more.
 */
export function nowItem(items: DayItem[], hhmm: string): DayItem | undefined {
  const list = items.filter((i) => i.kind !== 'trabajo')
  const t = toMin(hhmm)
  const first = list[0]
  const sleep = list.find((i) => i.id === 'sleep')
  if (sleep && t >= toMin(sleep.start)) return sleep
  if (first && t < toMin(first.start)) return first
  let current: DayItem | undefined
  for (const i of list) if (toMin(i.start) <= t) current = i
  if (current) {
    const end = current.end ? toMin(current.end) : toMin(current.start) + GRACE_MIN
    if (t < end) return current
  }
  return list.find((i) => toMin(i.start) > t) ?? sleep
}
