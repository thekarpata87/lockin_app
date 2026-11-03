import { describe, expect, it } from 'vitest'
import { CARDIO_SESSIONS, CIRCUIT_B } from './cardio'
import type { CardioSegment } from './cardio'
import { FOODS, FOOD_BY_ID, PRE_OPTIONS } from './foods'
import { RECIPES } from './recipes'
import { EXERCISE_BY_ID, GYM_DAYS, RECORD_EXERCISES } from './routines'
import { PREP_TEMPLATE } from './rules'
import { SLEEP_RAMP, WEEKDAY_SCHEDULE } from './schedule'

const unique = (xs: string[]) => new Set(xs).size === xs.length

const segmentSec = (s: CardioSegment) =>
  s.kind === 'circuit'
    ? s.rounds * s.exercises.length * (s.workSec + s.restSec)
    : s.kind === 'intervals'
      ? s.rounds * (s.workSec + s.restSec)
      : s.sec

describe('content integrity', () => {
  it('ids are unique', () => {
    expect(unique(FOODS.map((f) => f.id))).toBe(true)
    expect(unique(RECIPES.map((r) => r.id))).toBe(true)
    expect(unique(GYM_DAYS.flatMap((d) => d.exercises.map((e) => e.id)))).toBe(true)
    expect(unique(PREP_TEMPLATE.map((p) => p.id))).toBe(true)
    expect(unique(WEEKDAY_SCHEDULE.map((s) => s.id))).toBe(true)
  })

  it('25 recipes: 5 desayunos, 5 colaciones, 8 comidas, 7 cenas', () => {
    const count = (m: string) => RECIPES.filter((r) => r.meal === m).length
    expect([count('desayuno'), count('colacion'), count('comida'), count('cena')]).toEqual([5, 5, 8, 7])
  })

  it('recipe items and pre options reference known foods', () => {
    for (const r of RECIPES) for (const i of r.ingredients) for (const it of i.items ?? []) expect(FOOD_BY_ID.has(it.foodId), it.foodId).toBe(true)
    for (const p of PRE_OPTIONS) expect(FOOD_BY_ID.get(p.foodId)?.group).toBe('F')
  })

  it('prep tasks only on prep recipes; every task has a template step', () => {
    const tasks = new Set(PREP_TEMPLATE.flatMap((p) => (p.when.kind === 'task' ? [p.when.task] : [])))
    for (const r of RECIPES) {
      if (!r.tags.includes('prep')) expect(r.prepTasks, r.id).toEqual([])
      for (const t of r.prepTasks) expect(tasks.has(t), t).toBe(true)
    }
  })

  it('gym: 5 days, records exist', () => {
    expect(GYM_DAYS.map((d) => d.key)).toEqual(['lun', 'mar', 'mie', 'jue', 'vie'])
    expect(GYM_DAYS.map((d) => d.exercises.length)).toEqual([7, 6, 6, 9, 10])
    for (const id of RECORD_EXERCISES) expect(EXERCISE_BY_ID.has(id), id).toBe(true)
  })

  it('cardio A, B and C last 40 min; circuit B uses its 6 exercises', () => {
    for (const id of ['A', 'B', 'C']) {
      const s = CARDIO_SESSIONS.find((c) => c.id === id)!
      expect(s.segments.reduce((sum, seg) => sum + segmentSec(seg), 0), id).toBe(40 * 60)
    }
    const circuit = CARDIO_SESSIONS.find((c) => c.id === 'B')!.segments.find((s) => s.kind === 'circuit')
    expect(circuit && circuit.kind === 'circuit' && circuit.exercises).toEqual(CIRCUIT_B.map((e) => e.id))
  })

  it('sleep ramp ends at the normal schedule', () => {
    const last = SLEEP_RAMP[SLEEP_RAMP.length - 1]!
    expect([last.sleep, last.wake]).toEqual(['22:00', '05:15'])
  })
})
