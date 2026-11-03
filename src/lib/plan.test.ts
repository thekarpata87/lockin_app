import { describe, expect, it } from 'vitest'
import { getRecipe } from '../data/recipes'
import { emptyWeekPlan } from '../db/repo/weeklyPlans'
import type { WeekPlan } from '../db/schema'
import { recipeBlocks } from './blocks'
import { autoPlan, distribute, needsFreshWarning, plannedMeals, setDayRecipe, setSwap, togglePick, withSwaps } from './plan'
import { containers, freshMeals, prepSteps } from './prep'
import { formatGrams, shoppingList } from './shopping'

/** Test week, calculated by hand in the comments below. */
export function testWeek(): WeekPlan {
  let p = emptyWeekPlan()
  p = { ...p, picks: { desayuno: ['des-licuado-rojos'], colacion: ['col-tostadas-atun'], comida: ['com-bowl-pollo', 'com-tacos-bistec'], cena: ['cen-tacos-pollo', 'cen-salmon-papa'] } }
  return autoPlan(p)
}

describe('distribution', () => {
  it('rotates without consecutive repeats', () => {
    expect(distribute(['a', 'b', 'c'], ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'])).toEqual({ lun: 'a', mar: 'b', mie: 'c', jue: 'a', vie: 'b', sab: 'c' })
    const two = Object.values(distribute(['a', 'b'], ['lun', 'mar', 'mie', 'jue', 'vie', 'sab']))
    two.forEach((v, i) => i && expect(v).not.toBe(two[i - 1]))
  })

  it('lunch/dinner Mon–Sat, breakfast/snack 7 days', () => {
    const w = testWeek()
    expect(w.days.dom).toEqual({ desayuno: 'des-licuado-rojos', colacion: 'col-tostadas-atun' })
    expect(w.days.jue).toMatchObject({ comida: 'com-tacos-bistec', cena: 'cen-salmon-papa' })
    expect(plannedMeals(w)).toHaveLength(7 * 2 + 6 * 2)
  })

  it('pick limits and manual edits', () => {
    let p = emptyWeekPlan()
    for (const id of ['com-bowl-pollo', 'com-tacos-bistec', 'com-pasta-pollo', 'com-fajitas-pollo']) p = togglePick(p, 'comida', id)
    expect(p.picks.comida).toHaveLength(3)
    p = togglePick(p, 'comida', 'com-bowl-pollo')
    expect(p.picks.comida).toEqual(['com-tacos-bistec', 'com-pasta-pollo'])
    p = setDayRecipe(autoPlan(p), 'mar', 'comida', 'com-fajitas-pollo')
    expect(p.days.mar?.comida).toBe('com-fajitas-pollo')
  })

  it('fresh warning only Thu–Sat lunch/dinner that is not freezable', () => {
    expect(needsFreshWarning('jue', 'cena', 'cen-salmon-papa')).toBe(true)
    expect(needsFreshWarning('mar', 'cena', 'cen-salmon-papa')).toBe(false)
    expect(needsFreshWarning('vie', 'comida', 'com-bowl-pollo')).toBe(false)
    expect(needsFreshWarning('sab', 'desayuno', 'des-licuado-rojos')).toBe(false)
  })
})

describe('protein swap for the week', () => {
  it('pollo → pescado keeps blocks, rewrites text and drops the chicken prep step', () => {
    const r = withSwaps(getRecipe('com-bowl-pollo'), { pollo: 'pescado' })
    expect(recipeBlocks(r)).toEqual(recipeBlocks(getRecipe('com-bowl-pollo')))
    expect(r.ingredients[0]).toMatchObject({ text: '240 g de filete de pescado blanco', items: [{ foodId: 'pescado', amount: 240, unit: 'g' }] })
    expect(r.prepTasks).toEqual(['arroz', 'vapor'])
  })

  it('pollo → res on shredded tacos drops deshebrar and adds the steak step', () => {
    expect(withSwaps(getRecipe('cen-tacos-pollo'), { pollo: 'res' }).prepTasks.sort()).toEqual(['nopales', 'res'])
  })

  it('setSwap stores and clears', () => {
    let p = setSwap(emptyWeekPlan(), 'com-bowl-pollo', 'pollo', 'pescado')
    expect(p.swaps).toEqual({ 'com-bowl-pollo': { pollo: 'pescado' } })
    p = setSwap(p, 'com-bowl-pollo', 'pollo', undefined)
    expect(p.swaps).toEqual({})
  })
})

describe('shopping list (manual calculation of the test week)', () => {
  const list = shoppingList(testWeek())
  const item = (id: string) => list.flatMap((g) => g.items).find((i) => i.id === id)

  it('meats: cooked × 1.25, rounded up to 25 g', () => {
    // pollo: bowl 180 g × 3 + tacos 120 g × 3 = 900 g cocido → 1125 g crudo
    expect(item('pollo')).toMatchObject({ qty: '1.125 kg', detail: 'crudo · 900 g cocido' })
    // res: 180 g × 3 = 540 cocido → 675 g crudo (CONTENT §5 example)
    expect(item('res')?.qty).toBe('675 g')
    // salmón: 120 × 3 = 360 → 450 g
    expect(item('salmon')?.qty).toBe('450 g')
  })

  it('grains, tortillas and potatoes', () => {
    // arroz: ¾ taza = 3 bloques × 3 comidas = 9 × 14 g = 126 g crudo → 150 g
    expect(item('arroz')?.qty).toBe('150 g')
    // tortillas: 3 × 3 + 2 × 3 = 15 → 15/33 kg → 0.5 kg
    expect(item('tortilla')).toMatchObject({ qty: '0.5 kg', detail: '15 bloques' })
    // papa: 1 pza (2 bloques × 85 g) × 3 = 510 g → 600 g
    expect(item('papa')?.qty).toBe('600 g')
  })

  it('units: cans, milk, avocado, whey', () => {
    // atún: 1 lata × 7 colaciones
    expect(item('atun')?.qty).toBe('7 latas de 140 g')
    // leche: 250 ml × 7 = 7 bloques → 1.75 L → 2 L
    expect(item('leche')?.qty).toBe('2 litros')
    // aguacate: ¼ × (3 bowl + 3 tacos + 7 tostadas) = 3.25 → 4 piezas
    expect(item('aguacate')?.qty).toBe('4 piezas')
    expect(item('whey')?.qty).toBe('7 scoops')
    expect(item('tostadas')?.qty).toBe('140 g')
  })

  it('vegetables and fruit by weight or pieces', () => {
    // nopales: 1.5 × 3 + 1 × 3 = 7.5 tazas × 150 g = 1125 → 1.2 kg
    expect(item('nopales')?.qty).toBe('1.2 kg')
    // brócoli: 3 tazas × 90 = 270 → 300 g
    expect(item('brocoli')?.qty).toBe('300 g')
    // pepino: 0.4 × 7 = 2.8 tazas × 120 = 336 g → 2 piezas
    expect(item('pepino')?.qty).toBe('2 piezas')
    // jitomate: 0.4 × 7 × 180 = 504 g → 4 piezas
    expect(item('jitomate')?.qty).toBe('4 piezas')
    // fresa: 7 tazas × 150 = 1050 → 1.1 kg
    expect(item('fresa')?.qty).toBe('1.1 kg')
  })

  it('groups by store section in order', () => {
    expect(list.map((g) => g.title)).toEqual(['Carnes y pescados', 'Lácteos y huevo', 'Frutas', 'Verduras', 'Abarrotes', 'Tortillería'])
  })

  it('formats grams', () => {
    expect(formatGrams(675)).toBe('675 g')
    expect(formatGrams(1250)).toBe('1.25 kg')
    expect(formatGrams(1000)).toBe('1 kg')
  })
})

describe('Sunday prep', () => {
  const w = testWeek()

  it('includes only the steps the week needs', () => {
    expect(prepSteps(w).map((s) => s.id)).toEqual([
      'p-setup', 'p-arroz', 'p-pollo', 'p-picar', 'p-vapor', 'p-res', 'p-nopales', 'p-deshebrar', 'p-enfriar', 'p-pesar', 'p-etiquetar',
    ])
  })

  it('pasta step appears only with pasta', () => {
    const p = autoPlan({ ...emptyWeekPlan(), picks: { ...emptyWeekPlan().picks, comida: ['com-pasta-pollo', 'com-cerdo-elote'] } })
    const ids = prepSteps(p).map((s) => s.id)
    expect(ids).toContain('p-pasta')
    expect(ids).toContain('p-cerdo')
    expect(ids).not.toContain('p-arroz')
  })

  it('containers: Mon–Wed fridge, Thu–Sat freezer; fresh meals listed apart', () => {
    const c = containers(w)
    expect(c.filter((x) => x.dest === 'Refri').map((x) => `${x.day}:${x.recipeId}`)).toEqual([
      'lun:com-bowl-pollo', 'lun:cen-tacos-pollo', 'mar:com-tacos-bistec', 'mie:com-bowl-pollo', 'mie:cen-tacos-pollo',
    ])
    expect(c.filter((x) => x.dest === 'Congelador')).toHaveLength(4)
    expect(freshMeals(w).map((f) => f.day)).toEqual(['mar', 'jue', 'sab'])
  })

  it('no prep recipes → no guide', () => {
    expect(prepSteps(emptyWeekPlan())).toEqual([])
  })
})
