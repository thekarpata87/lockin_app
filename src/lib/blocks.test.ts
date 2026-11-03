import { describe, expect, it } from 'vitest'
import { MEALS } from '../data/foods'
import { RECIPES } from '../data/recipes'
import {
  amountForBlocks,
  blocksEqual,
  clampFilled,
  dayProgress,
  dayTargets,
  fillMeal,
  ingredientDerivedBlocks,
  itemBlocks,
  mealGroups,
  mealProgress,
  recipeBlocks,
  recipeFitsMeal,
  swapItem,
  tapCell,
} from './blocks'
import { getFood } from '../data/foods'

describe('targets', () => {
  it('day totals match CONTENT §2.2', () => {
    expect(dayTargets()).toEqual({ V: 4, F: 2, C: 6, P: 16, L: 1, G: 3 })
  })

  it('meal groups follow display order', () => {
    expect(mealGroups('comida')).toEqual(['V', 'C', 'P', 'G'])
    expect(mealGroups('pre')).toEqual(['F'])
  })
})

describe('recipes', () => {
  it.each(RECIPES.map((r) => [r.id, r] as const))('%s: blocks add up to its meal', (_id, r) => {
    expect(recipeBlocks(r)).toEqual(MEALS[r.meal].blocks)
    expect(recipeFitsMeal(r)).toBe(true)
  })

  it.each(RECIPES.map((r) => [r.id, r] as const))('%s: quantities match stated blocks', (_id, r) => {
    for (const ing of r.ingredients) {
      if (!ing.group) continue
      expect(ing.items, `${r.id} · ${ing.text}`).toBeDefined()
      expect(ingredientDerivedBlocks(ing), `${r.id} · ${ing.text}`).toBe(ing.blocks)
      for (const it of ing.items ?? []) expect(getFood(it.foodId).group).toBe(ing.group)
    }
  })
})

describe('itemBlocks', () => {
  it('converts grams, pieces and fractions', () => {
    expect(itemBlocks({ foodId: 'pollo', amount: 180, unit: 'g' })).toBe(6)
    expect(itemBlocks({ foodId: 'whey', amount: 1, unit: 'scoop' })).toBe(3)
    expect(itemBlocks({ foodId: 'claras', amount: 4, unit: 'pza' })).toBe(2)
    expect(itemBlocks({ foodId: 'panela', amount: 160, unit: 'g' })).toBe(4)
  })

  it('rejects units it cannot convert', () => {
    expect(() => itemBlocks({ foodId: 'tortilla', amount: 100, unit: 'g' })).toThrow()
  })
})

describe('filling', () => {
  it('tapCell fills up to the tapped cell and empties from a filled one', () => {
    let f = tapCell('comida', {}, 'P', 2)
    expect(f.P).toBe(3)
    f = tapCell('comida', f, 'P', 5)
    expect(f.P).toBe(6)
    f = tapCell('comida', f, 'P', 1)
    expect(f.P).toBe(1)
    f = tapCell('comida', f, 'P', 0)
    expect(f.P).toBeUndefined()
  })

  it('tapCell ignores cells outside the target', () => {
    expect(tapCell('comida', {}, 'L', 0)).toEqual({})
    expect(tapCell('comida', {}, 'P', 6)).toEqual({})
  })

  it('meal and day progress', () => {
    expect(mealProgress('desayuno', { F: 1, P: 2 })).toEqual({ done: 3, total: 5, complete: false })
    expect(mealProgress('desayuno', fillMeal('desayuno')).complete).toBe(true)
    expect(clampFilled('pre', { F: 4, P: 2 })).toEqual({ F: 1 })

    const full = { pre: { filled: fillMeal('pre') }, desayuno: { filled: fillMeal('desayuno') }, colacion: { filled: fillMeal('colacion') }, comida: { filled: fillMeal('comida') } }
    expect(dayProgress(full)).toEqual({ done: 24, total: 32, complete: false })
    expect(dayProgress({ ...full, cena: { filled: fillMeal('cena') } }).complete).toBe(true)
  })
})

describe('protein swap', () => {
  it('180 g pollo (6 bloques) → 240 g pescado', () => {
    expect(swapItem({ foodId: 'pollo', amount: 180, unit: 'g' }, 'pescado')).toEqual({ foodId: 'pescado', amount: 240, unit: 'g' })
  })

  it('swaps into piece-based foods', () => {
    expect(swapItem({ foodId: 'pollo', amount: 180, unit: 'g' }, 'huevo')).toEqual({ foodId: 'huevo', amount: 6, unit: 'pza' })
    expect(amountForBlocks(getFood('camaron'), 6)).toEqual({ amount: 30, unit: 'pza' })
  })

  it('refuses cross-group swaps', () => {
    expect(() => swapItem({ foodId: 'pollo', amount: 90, unit: 'g' }, 'arroz')).toThrow()
  })

  it('blocksEqual tolerates float noise', () => {
    expect(blocksEqual({ P: 0.1 + 0.2 }, { P: 0.3 })).toBe(true)
  })
})
