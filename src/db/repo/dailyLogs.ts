import type { Blocks, MealKey } from '../../data/types'
import { db } from '../schema'
import type { DailyLog, Habits } from '../schema'
import { alive, updateRecord } from '../write'

export const EMPTY_HABITS: Habits = { pre: false, gym: false, gymCardio: false, homeCardio: false, sleepOnTime: false }

export const emptyDailyLog = (date: string): Omit<DailyLog, 'updatedAt' | 'deleted' | 'dirty'> => ({
  date,
  meals: {},
  waterMl: 0,
  habits: { ...EMPTY_HABITS },
  flexMeal: false,
})

/** Undefined until something is logged that day. */
export async function getDailyLog(date: string) {
  return alive(await db.dailyLogs.get(date))
}

export function updateDailyLog(date: string, mutate: (cur: DailyLog) => DailyLog): Promise<DailyLog> {
  return updateRecord(db.dailyLogs, date, () => emptyDailyLog(date), mutate)
}

export const setMealFilled = (date: string, meal: MealKey, filled: Blocks) =>
  updateDailyLog(date, (cur) => ({ ...cur, meals: { ...cur.meals, [meal]: { ...cur.meals[meal], filled } } }))

/** Per-day recipe override; null = build with blocks, undefined = back to the weekly plan. */
export const setMealRecipe = (date: string, meal: MealKey, recipeId: string | null | undefined) =>
  updateDailyLog(date, (cur) => ({
    ...cur,
    meals: { ...cur.meals, [meal]: { filled: cur.meals[meal]?.filled ?? {}, recipeId } },
  }))

export const setWater = (date: string, ml: number) =>
  updateDailyLog(date, (cur) => ({ ...cur, waterMl: Math.max(0, Math.round(ml)) }))

export const addWater = (date: string, ml: number) =>
  updateDailyLog(date, (cur) => ({ ...cur, waterMl: Math.max(0, cur.waterMl + ml) }))

export const setHabit = (date: string, habit: keyof Habits, value: boolean) =>
  updateDailyLog(date, (cur) => ({ ...cur, habits: { ...EMPTY_HABITS, ...cur.habits, [habit]: value } }))

export const setSteps = (date: string, steps: number | undefined) =>
  updateDailyLog(date, (cur) => ({ ...cur, steps }))

export const setFlexMeal = (date: string, value: boolean) =>
  updateDailyLog(date, (cur) => ({ ...cur, flexMeal: value }))

/** Inclusive range, oldest first. */
export async function listDailyLogs(from: string, to: string): Promise<DailyLog[]> {
  const rows = await db.dailyLogs.where('date').between(from, to, true, true).toArray()
  return rows.filter((r) => !r.deleted)
}
