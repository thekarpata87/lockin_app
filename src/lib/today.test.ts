import { describe, expect, it } from 'vitest'
import type { DailyLog, WeekPlan } from '../db/schema'
import { flexUsedOtherDay, formatLiters, habitsFor, mealRecipeId, parseDecimal, tapWater, waterCells } from './today'

const log = (meals: DailyLog['meals'], extra: Partial<DailyLog> = {}): DailyLog => ({
  date: '2026-11-03', meals, waterMl: 0, habits: { pre: false, gym: false, gymCardio: false, homeCardio: false, sleepOnTime: false },
  flexMeal: false, updatedAt: 1, deleted: 0, dirty: 0, ...extra,
})
const plan: WeekPlan = { picks: { desayuno: [], colacion: [], comida: [], cena: [] }, days: { mar: { comida: 'com-bowl-pollo' } } }

describe('mealRecipeId', () => {
  it('uses the weekly plan unless the day overrides it', () => {
    expect(mealRecipeId(undefined, plan, 'mar', 'comida')).toBe('com-bowl-pollo')
    expect(mealRecipeId(log({ comida: { filled: {}, recipeId: 'com-tacos-bistec' } }), plan, 'mar', 'comida')).toBe('com-tacos-bistec')
    expect(mealRecipeId(log({ comida: { filled: {}, recipeId: null } }), plan, 'mar', 'comida')).toBeNull()
    expect(mealRecipeId(log({ comida: { filled: { P: 2 } } }), plan, 'mar', 'comida')).toBe('com-bowl-pollo')
    expect(mealRecipeId(undefined, undefined, 'mar', 'cena')).toBeNull()
    expect(mealRecipeId(undefined, plan, 'mar', 'pre')).toBeNull()
  })
})

describe('habits and water', () => {
  it('habits by day', () => {
    expect(habitsFor('lun')).toHaveLength(5)
    expect(habitsFor('sab')).toEqual(['pre', 'homeCardio', 'sleepOnTime'])
    expect(habitsFor('dom')).toEqual(['pre', 'sleepOnTime'])
  })

  it('water cells and taps', () => {
    expect(waterCells(1500)).toBe(6)
    expect(waterCells(5000)).toBe(12)
    expect(tapWater(1500, 7)).toBe(2000)
    expect(tapWater(1500, 2)).toBe(500)
    expect(tapWater(250, 0)).toBe(0)
    expect(formatLiters(1500)).toBe('1.5')
    expect(formatLiters(1750)).toBe('1.75')
    expect(formatLiters(3000)).toBe('3')
  })

  it('flex meal used another day of the week', () => {
    expect(flexUsedOtherDay([log({}, { date: '2026-11-01', flexMeal: true })], '2026-11-03')).toBe('2026-11-01')
    expect(flexUsedOtherDay([log({}, { flexMeal: true })], '2026-11-03')).toBeUndefined()
  })

  it('parses decimals with comma or dot', () => {
    expect(parseDecimal('98,4')).toBe(98.4)
    expect(parseDecimal(' 98.4 ')).toBe(98.4)
    expect(parseDecimal('')).toBeUndefined()
    expect(parseDecimal('abc')).toBeUndefined()
  })
})

import { isMealOverdue } from './today'

describe('isMealOverdue', () => {
  it('after 45 min and not checked', () => {
    expect(isMealOverdue('13:30', '14:10', false)).toBe(false)
    expect(isMealOverdue('13:30', '14:16', false)).toBe(true)
    expect(isMealOverdue('13:30', '20:00', true)).toBe(false)
  })
})
