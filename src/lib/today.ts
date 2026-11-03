// HOY helpers: which recipe a meal shows, which habits apply, water cells, flex meal.
import { WATER } from '../data/profile'
import type { DayKey, MealKey } from '../data/types'
import type { DailyLog, Habits, WeekPlan } from '../db/schema'

/** Per-day override wins (null = build with blocks); otherwise the weekly plan; otherwise none. */
export function mealRecipeId(log: DailyLog | undefined, plan: WeekPlan | undefined, dayKey: DayKey, meal: MealKey): string | null {
  if (meal === 'pre') return null
  const override = log?.meals[meal]?.recipeId
  if (override !== undefined) return override
  return plan?.days[dayKey]?.[meal] ?? null
}

/** Habits shown as checklist rows (thaw has its own reminder). */
export type HabitKey = Exclude<keyof Habits, 'thaw'>

export const HABIT_LABELS: Record<HabitKey, string> = {
  pre: 'Pre-entreno y creatina',
  gym: 'Gym',
  gymCardio: 'Cardio post-gym',
  homeCardio: 'Cardio en casa',
  sleepOnTime: 'Dormir a la hora meta',
}

/** Saturday has no gym; Sunday is rest. */
export function habitsFor(dayKey: DayKey): HabitKey[] {
  if (dayKey === 'dom') return ['pre', 'sleepOnTime']
  if (dayKey === 'sab') return ['pre', 'homeCardio', 'sleepOnTime']
  return ['pre', 'gym', 'gymCardio', 'homeCardio', 'sleepOnTime']
}

export const waterCells = (ml: number) => Math.min(WATER.cells, Math.floor(ml / WATER.cellMl))

/** Tap water cell `index`: same rule as block cells (fill up to it, or empty from a filled one). */
export function tapWater(ml: number, index: number): number {
  const filled = waterCells(ml)
  const next = index < filled ? index : index + 1
  return next * WATER.cellMl
}

/** Another day of the same week where the flex meal was used, if any. */
export function flexUsedOtherDay(weekLogs: DailyLog[], date: string): string | undefined {
  return weekLogs.find((l) => l.flexMeal && l.date !== date && !l.deleted)?.date
}

/** Parse a user number accepting comma or dot as decimal separator. */
export function parseDecimal(s: string): number | undefined {
  const n = Number(s.trim().replace(',', '.'))
  return s.trim() !== '' && Number.isFinite(n) ? n : undefined
}

export const formatLiters = (ml: number) => {
  const l = ml / 1000
  return Number.isInteger(l) ? String(l) : l.toFixed(2).replace(/0$/, '')
}

/** Minutes after a meal's time before an unchecked meal shows as "Pendiente". */
export const MEAL_GRACE_MIN = 45

export function isMealOverdue(mealTime: string, nowHHmm: string, complete: boolean): boolean {
  if (complete) return false
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  return toMin(nowHHmm) > toMin(mealTime) + MEAL_GRACE_MIN
}
