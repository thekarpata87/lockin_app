// Local-time date helpers. Dates are stored as YYYY-MM-DD in the phone's timezone.
import type { DayKey } from '../data/types'

const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Parse YYYY-MM-DD as local midnight. */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) throw new Error(`Invalid date: ${s}`)
  return new Date(y, m - 1, d)
}

export const today = () => toISODate(new Date())

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

const KEYS: DayKey[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']

export const dayKeyOf = (iso: string): DayKey => KEYS[fromISODate(iso).getDay()]!

/** Monday of the week containing `iso`. */
export function weekStartOf(iso: string): string {
  const dow = fromISODate(iso).getDay() // 0 = Sunday
  return addDays(iso, dow === 0 ? -6 : 1 - dow)
}

/** Whole days from a to b (b − a), DST-safe. */
export function daysBetween(a: string, b: string): number {
  const ms = Date.UTC(...ymd(b)) - Date.UTC(...ymd(a))
  return Math.round(ms / 86_400_000)
}

function ymd(iso: string): [number, number, number] {
  const d = fromISODate(iso)
  return [d.getFullYear(), d.getMonth(), d.getDate()]
}

/** "Día N del plan": start date is day 1. */
export const planDay = (startDate: string, on: string) => daysBetween(startDate, on) + 1
