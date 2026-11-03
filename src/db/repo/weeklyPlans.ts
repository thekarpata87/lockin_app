import { db } from '../schema'
import type { WeekPlan, WeeklyPlan } from '../schema'
import { alive, updateRecord } from '../write'

export const emptyWeekPlan = (): WeekPlan => ({ picks: { desayuno: [], colacion: [], comida: [], cena: [] }, days: {} })

const create = (weekStart: string) => () => ({ weekStart, plan: emptyWeekPlan(), shoppingChecked: [] })

export async function getWeeklyPlan(weekStart: string) {
  return alive(await db.weeklyPlans.get(weekStart))
}

export const saveWeekPlan = (weekStart: string, plan: WeekPlan): Promise<WeeklyPlan> =>
  updateRecord(db.weeklyPlans, weekStart, create(weekStart), (cur) => ({ ...cur, plan }))

export const toggleShoppingItem = (weekStart: string, itemId: string): Promise<WeeklyPlan> =>
  updateRecord(db.weeklyPlans, weekStart, create(weekStart), (cur) => ({
    ...cur,
    shoppingChecked: cur.shoppingChecked.includes(itemId)
      ? cur.shoppingChecked.filter((i) => i !== itemId)
      : [...cur.shoppingChecked, itemId],
  }))
