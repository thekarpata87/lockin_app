// Sunday prep guide (CONTENT §7) and the containers to label.
import { PREP_TEMPLATE } from '../data/rules'
import type { PrepStep } from '../data/rules'
import type { PrepTask } from '../data/recipes'
import type { DayKey } from '../data/types'
import type { WeekPlan } from '../db/schema'
import { plannedMeals } from './plan'
import type { PlanMeal } from './plan'

export function prepTasks(plan: WeekPlan): Set<PrepTask> {
  const tasks = new Set<PrepTask>()
  for (const { recipe } of plannedMeals(plan)) {
    if (!recipe.tags.includes('prep')) continue
    for (const t of recipe.prepTasks) tasks.add(t)
  }
  return tasks
}

/** Only the steps the week needs. Without any prep recipe there is no guide. */
export function prepSteps(plan: WeekPlan): PrepStep[] {
  const tasks = prepTasks(plan)
  if (!containers(plan).length) return []
  return PREP_TEMPLATE.filter((s) => s.when.kind === 'always' || tasks.has(s.when.task))
}

export type Container = { day: DayKey; meal: PlanMeal; recipeId: string; name: string; dest: 'Refri' | 'Congelador' }
export type FreshMeal = { day: DayKey; meal: PlanMeal; recipeId: string; name: string }

const FRIDGE: DayKey[] = ['lun', 'mar', 'mie']

/** Prep recipes Mon–Sat. Mon–Wed go to the fridge, Thu–Sat to the freezer (only if freezable). */
export function containers(plan: WeekPlan): Container[] {
  return plannedMeals(plan)
    .filter(({ day, recipe }) => day !== 'dom' && recipe.tags.includes('prep') && (FRIDGE.includes(day) || recipe.tags.includes('cong')))
    .map(({ day, meal, recipe }) => ({ day, meal, recipeId: recipe.id, name: recipe.name, dest: FRIDGE.includes(day) ? 'Refri' : 'Congelador' }))
}

/** Lunch/dinner to cook on the day: fresh recipes, or prep ones that can't be frozen for Thu–Sat. */
export function freshMeals(plan: WeekPlan): FreshMeal[] {
  return plannedMeals(plan)
    .filter(({ meal }) => meal === 'comida' || meal === 'cena')
    .filter(({ day, recipe }) => !recipe.tags.includes('prep') || (!FRIDGE.includes(day) && !recipe.tags.includes('cong')))
    .filter(({ day }) => day !== 'dom')
    .map(({ day, meal, recipe }) => ({ day, meal, recipeId: recipe.id, name: recipe.name }))
}

/** "0:05" from minutes. */
export const fmtOffset = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

/** Tonight: containers for tomorrow that are in the freezer and should move to the fridge. */
export function thawTonight(planForTomorrow: WeekPlan | undefined, tomorrow: DayKey): Container[] {
  if (!planForTomorrow) return []
  return containers(planForTomorrow).filter((c) => c.day === tomorrow && c.dest === 'Congelador')
}
