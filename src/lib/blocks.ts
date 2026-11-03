// Block math (CONTENT §2): targets per meal and day, recipe validation, filling cells, protein swap.
import { getFood, MEALS } from '../data/foods'
import type { Food } from '../data/foods'
import type { Ingredient, Recipe, RecipeItem } from '../data/recipes'
import { GROUP_ORDER, MEAL_ORDER } from '../data/types'
import type { Amount, Blocks, Group, MealKey } from '../data/types'

const round2 = (n: number) => Math.round(n * 100) / 100

export function addBlocks(a: Blocks, b: Blocks): Blocks {
  const out: Blocks = { ...a }
  for (const g of GROUP_ORDER) {
    const v = (a[g] ?? 0) + (b[g] ?? 0)
    if (v) out[g] = round2(v)
    else delete out[g]
  }
  return out
}

export function blocksEqual(a: Blocks, b: Blocks): boolean {
  return GROUP_ORDER.every((g) => round2(a[g] ?? 0) === round2(b[g] ?? 0))
}

export const totalBlocks = (b: Blocks) => GROUP_ORDER.reduce((s, g) => s + (b[g] ?? 0), 0)

/** Groups with a target in this meal, in display order. */
export const mealGroups = (meal: MealKey): Group[] => GROUP_ORDER.filter((g) => (MEALS[meal].blocks[g] ?? 0) > 0)

export const mealTargets = (meal: MealKey): Blocks => ({ ...MEALS[meal].blocks })

/** Same targets every day of the week (CONTENT §2.2). */
export const dayTargets = (): Blocks => MEAL_ORDER.reduce<Blocks>((acc, m) => addBlocks(acc, MEALS[m].blocks), {})

/** Blocks one recipe item represents, from the food's per-block definition. */
export function itemBlocks(item: RecipeItem | (Amount & { foodId: string })): number {
  const food = getFood(item.foodId)
  if (item.unit === food.perBlock.unit) return round2(item.amount / food.perBlock.amount)
  if (item.unit === 'g' && food.grams) return round2(item.amount / food.grams)
  throw new Error(`Cannot convert ${item.amount} ${item.unit} of ${item.foodId} to blocks`)
}

/** Blocks as stated in the recipe (CONTENT labels like "(P6)"). */
export function recipeBlocks(r: Recipe): Blocks {
  return r.ingredients.reduce<Blocks>((acc, i) => (i.group && i.blocks ? addBlocks(acc, { [i.group]: i.blocks }) : acc), {})
}

/** Blocks computed from structured quantities, ingredient by ingredient. */
export function ingredientDerivedBlocks(i: Ingredient): number {
  return round2((i.items ?? []).reduce((s, it) => s + itemBlocks(it), 0))
}

export const recipeFitsMeal = (r: Recipe) => blocksEqual(recipeBlocks(r), MEALS[r.meal].blocks)

// ---- Filling cells (HOY) ----

export type Progress = { done: number; total: number; complete: boolean }

/** Clamp filled counts to the meal's targets. */
export function clampFilled(meal: MealKey, filled: Blocks): Blocks {
  const out: Blocks = {}
  for (const g of mealGroups(meal)) {
    const v = Math.max(0, Math.min(filled[g] ?? 0, MEALS[meal].blocks[g] ?? 0))
    if (v) out[g] = v
  }
  return out
}

export function mealProgress(meal: MealKey, filled: Blocks): Progress {
  const total = totalBlocks(MEALS[meal].blocks)
  const done = totalBlocks(clampFilled(meal, filled))
  return { done, total, complete: done === total }
}

export function dayProgress(meals: Partial<Record<MealKey, { filled: Blocks }>>): Progress {
  let done = 0
  let total = 0
  for (const m of MEAL_ORDER) {
    const p = mealProgress(m, meals[m]?.filled ?? {})
    done += p.done
    total += p.total
  }
  return { done, total, complete: done === total }
}

/** "Marcar como comida": fill every block of the meal. */
export const fillMeal = (meal: MealKey): Blocks => mealTargets(meal)

/**
 * Tap on cell `index` (0-based) of a group: an empty cell fills up to it;
 * tapping a filled cell empties it and everything after it.
 */
export function tapCell(meal: MealKey, filled: Blocks, group: Group, index: number): Blocks {
  const target = MEALS[meal].blocks[group] ?? 0
  if (index < 0 || index >= target) return filled
  const current = Math.min(filled[group] ?? 0, target)
  const next = index < current ? index : index + 1
  const out = { ...filled }
  if (next) out[group] = next
  else delete out[group]
  return out
}

// ---- Protein swap (COMIDA → Cambiar proteína) ----

/** Amount of `food` that equals `blocks` blocks. */
export function amountForBlocks(food: Food, blocks: number): Amount {
  return { amount: round2(blocks * food.perBlock.amount), unit: food.perBlock.unit }
}

/** Replace one item with an equivalent amount of another food of the same group. */
export function swapItem(item: RecipeItem, toFoodId: string): RecipeItem {
  const from = getFood(item.foodId)
  const to = getFood(toFoodId)
  if (from.group !== to.group) throw new Error(`Cannot swap ${from.id} (${from.group}) for ${to.id} (${to.group})`)
  return { foodId: to.id, ...amountForBlocks(to, itemBlocks(item)) }
}
