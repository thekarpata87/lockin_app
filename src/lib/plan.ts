// Weekly plan: auto distribution, protein swaps, and which recipe lands on each day.
import { getFood } from '../data/foods'
import { getRecipe, RECIPE_BY_ID } from '../data/recipes'
import type { PrepTask, Recipe } from '../data/recipes'
import { DAY_ORDER } from '../data/types'
import type { DayKey, MealKey } from '../data/types'
import type { WeekPlan } from '../db/schema'
import { swapItem } from './blocks'

export type PlanMeal = Exclude<MealKey, 'pre'>
export const PLAN_MEALS: readonly PlanMeal[] = ['desayuno', 'colacion', 'comida', 'cena']

/** Lunch and dinner are planned Mon–Sat (Sunday is cooked fresh); breakfast and snack all week. */
export const PLAN_DAYS: Record<PlanMeal, readonly DayKey[]> = {
  desayuno: DAY_ORDER,
  colacion: DAY_ORDER,
  comida: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'],
  cena: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'],
}

export const PICK_LIMITS: Record<PlanMeal, { min: number; max: number }> = {
  desayuno: { min: 1, max: 2 },
  colacion: { min: 1, max: 2 },
  comida: { min: 2, max: 3 },
  cena: { min: 2, max: 3 },
}

/** Rotate the picks over the days: with 2+ picks the same recipe never lands on consecutive days. */
export function distribute(picks: readonly string[], days: readonly DayKey[]): Partial<Record<DayKey, string>> {
  const out: Partial<Record<DayKey, string>> = {}
  if (!picks.length) return out
  days.forEach((d, i) => (out[d] = picks[i % picks.length]))
  return out
}

/** Fill every day from the picks (manual edits are replaced). */
export function autoPlan(plan: WeekPlan): WeekPlan {
  const days: WeekPlan['days'] = {}
  for (const m of PLAN_MEALS) {
    const d = distribute(plan.picks[m], PLAN_DAYS[m])
    for (const [day, id] of Object.entries(d) as [DayKey, string][]) days[day] = { ...days[day], [m]: id }
  }
  return { ...plan, days }
}

export function togglePick(plan: WeekPlan, meal: PlanMeal, id: string): WeekPlan {
  const cur = plan.picks[meal]
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= PICK_LIMITS[meal].max ? cur : [...cur, id]
  return { ...plan, picks: { ...plan.picks, [meal]: next } }
}

export function setDayRecipe(plan: WeekPlan, day: DayKey, meal: PlanMeal, id: string | undefined): WeekPlan {
  const dayPlan = { ...plan.days[day] }
  if (id) dayPlan[meal] = id
  else delete dayPlan[meal]
  return { ...plan, days: { ...plan.days, [day]: dayPlan } }
}

/** Thu–Sat lunch/dinner that can't be frozen: "Esta receta conviene prepararla fresca ese día". */
export function needsFreshWarning(day: DayKey, meal: PlanMeal, recipeId: string | undefined): boolean {
  if (!recipeId || (meal !== 'comida' && meal !== 'cena')) return false
  if (day !== 'jue' && day !== 'vie' && day !== 'sab') return false
  return !RECIPE_BY_ID.get(recipeId)?.tags.includes('cong')
}

const PROTEIN_TASK: Partial<Record<string, PrepTask>> = { pollo: 'pollo', res: 'res', cerdo: 'cerdo' }

const fmtAmount = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))))

/** Recipe with this week's protein swaps applied (items, text and prep tasks). */
export function withSwaps(recipe: Recipe, swaps: Record<string, string> | undefined): Recipe {
  if (!swaps || !Object.keys(swaps).length) return recipe
  const ingredients = recipe.ingredients.map((ing) => {
    if (ing.group !== 'P' || !ing.items) return ing
    const items = ing.items.map((it) => (swaps[it.foodId] ? swapItem(it, swaps[it.foodId]!) : it))
    if (items.every((it, i) => it.foodId === ing.items![i]!.foodId)) return ing
    const text = items.map((it) => `${fmtAmount(it.amount)} ${it.unit} de ${getFood(it.foodId).name.toLowerCase()}`).join(' + ')
    return { ...ing, items, text }
  })
  const foods = new Set(ingredients.flatMap((i) => i.items?.map((it) => it.foodId) ?? []))
  const tasks = new Set(recipe.prepTasks.filter((t) => !(Object.values(PROTEIN_TASK) as PrepTask[]).includes(t) || [...foods].some((f) => PROTEIN_TASK[f] === t)))
  if (!foods.has('pollo')) tasks.delete('deshebrar')
  if (recipe.tags.includes('prep')) for (const f of foods) if (PROTEIN_TASK[f]) tasks.add(PROTEIN_TASK[f]!)
  return { ...recipe, ingredients, prepTasks: [...tasks] }
}

export type PlannedMeal = { day: DayKey; meal: PlanMeal; recipe: Recipe }

/** Every planned slot of the week, in day and meal order, with swaps applied. */
export function plannedMeals(plan: WeekPlan): PlannedMeal[] {
  const out: PlannedMeal[] = []
  for (const day of DAY_ORDER) {
    for (const meal of PLAN_MEALS) {
      if (!PLAN_DAYS[meal].includes(day)) continue
      const id = plan.days[day]?.[meal]
      if (!id || !RECIPE_BY_ID.has(id)) continue
      out.push({ day, meal, recipe: withSwaps(getRecipe(id), plan.swaps?.[id]) })
    }
  }
  return out
}

export function setSwap(plan: WeekPlan, recipeId: string, fromFoodId: string, toFoodId: string | undefined): WeekPlan {
  const cur = { ...plan.swaps?.[recipeId] }
  if (!toFoodId || toFoodId === fromFoodId) delete cur[fromFoodId]
  else cur[fromFoodId] = toFoodId
  const swaps = { ...plan.swaps, [recipeId]: cur }
  if (!Object.keys(cur).length) delete swaps[recipeId]
  return { ...plan, swaps }
}
