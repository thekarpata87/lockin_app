// Which week COMIDA is looking at. On Sunday you plan and prep the coming week.
import { useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { emptyWeekPlan, getWeeklyPlan, saveWeekPlan } from '../../db/repo/weeklyPlans'
import type { WeekPlan } from '../../db/schema'
import { addDays, dayKeyOf, fromISODate, today, weekStartOf } from '../../lib/dates'

export type WeekChoice = 'this' | 'next'

let choice: WeekChoice = dayKeyOf(today()) === 'dom' ? 'next' : 'this'
const subs = new Set<() => void>()

export function setWeekChoice(c: WeekChoice) {
  choice = c
  for (const s of subs) s()
}

export function useWeekChoice(): WeekChoice {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => choice,
  )
}

export function weekStartFor(c: WeekChoice, date = today()) {
  const ws = weekStartOf(date)
  return c === 'next' ? addDays(ws, 7) : ws
}

export function weekRangeLabel(weekStart: string) {
  const a = fromISODate(weekStart)
  const b = fromISODate(addDays(weekStart, 6))
  const sameMonth = a.getMonth() === b.getMonth()
  return sameMonth
    ? `${format(a, 'd', { locale: es })}–${format(b, 'd MMM', { locale: es })}`
    : `${format(a, 'd MMM', { locale: es })}–${format(b, 'd MMM', { locale: es })}`
}

/** The selected week's plan (empty until saved) and a saver. */
export function useWeekPlan() {
  const c = useWeekChoice()
  const weekStart = weekStartFor(c)
  const row = useLiveQuery(() => getWeeklyPlan(weekStart), [weekStart])
  const plan: WeekPlan = row?.plan ?? emptyWeekPlan()
  const save = (p: WeekPlan) => saveWeekPlan(weekStart, p)
  return { weekStart, plan, checked: row?.shoppingChecked ?? [], save }
}
