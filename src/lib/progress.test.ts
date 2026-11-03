import { describe, expect, it } from 'vitest'
import type { BodyMetric, DailyLog, SetLog, WorkoutSession } from '../db/schema'
import { fillMeal } from './blocks'
import { addDays } from './dates'
import { avg7, compliance, records, stats, suggestions, weekGrid, weeklyTable, weighIns } from './progress'

const sync = { updatedAt: 1, deleted: 0 as const, dirty: 0 as const }
const m = (date: string, weightKg: number): BodyMetric => ({ date, weightKg, ...sync })

/**
 * 4 test weeks starting Mon 2026-10-05 (plan day 1), weighing Mon–Fri.
 * Week 1: 100.0 99.8 99.6 99.4 99.2 → avg 99.6
 * Week 2:  99.0 98.8 98.6 98.4 98.2 → avg 98.6
 * Week 3:  98.0 97.8 97.6 97.4 97.2 → avg 97.6
 * Week 4:  97.0 96.8 96.6 96.4 96.2 → avg 96.6
 */
const START = '2026-10-05'
function fourWeeks(): BodyMetric[] {
  const out: BodyMetric[] = []
  let w = 100
  for (let wk = 0; wk < 4; wk++) {
    for (let d = 0; d < 5; d++) {
      out.push(m(addDays(START, wk * 7 + d), Math.round(w * 10) / 10))
      w -= 0.2
    }
  }
  return out
}

describe('averages with 4 weeks of data', () => {
  const ws = weighIns(fourWeeks())

  it('weekly table: averages, diffs and week numbers', () => {
    const t = weeklyTable(ws, START)
    expect(t.map((r) => [r.index, r.avg, r.count, r.diff])).toEqual([
      [1, 99.6, 5, null],
      [2, 98.6, 5, -1],
      [3, 97.6, 5, -1],
      [4, 96.6, 5, -1],
    ])
  })

  it('7-day average uses only the last 7 days', () => {
    // Sun of week 4 (2026-11-01): Mon–Fri of week 4 → 96.6
    expect(avg7(ws, '2026-11-01')).toBe(96.6)
    // Wed of week 4 (2026-10-28): Thu, Fri of week 3 + Mon–Wed of week 4 = (97.4+97.2+97.0+96.8+96.6)/5
    expect(avg7(ws, '2026-10-28')).toBe(97)
    expect(avg7(ws, '2026-09-01')).toBeNull()
  })

  it('stats: from start, to goal, pace', () => {
    const s = stats(ws, '2026-11-01', 85)
    expect(s).toMatchObject({ avg7: 96.6, start: 100, fromStart: -3.4, toGoal: 11.6, pace: -1 })
    expect(s.latest).toEqual({ date: '2026-10-30', weightKg: 96.2 })
  })

  it('deleted and empty entries are ignored', () => {
    const extra = [...fourWeeks(), { ...m('2026-11-01', 80), deleted: 1 as const }, { date: '2026-10-31', waistCm: 104, ...sync }]
    expect(weighIns(extra)).toHaveLength(20)
  })
})

const log = (date: string, over: Partial<DailyLog> = {}): DailyLog => ({
  date, meals: {}, waterMl: 3000, habits: { pre: true, gym: true, gymCardio: true, homeCardio: true, sleepOnTime: true }, flexMeal: false, ...sync, ...over,
})
const fullMeals = () => ({ pre: { filled: fillMeal('pre') }, desayuno: { filled: fillMeal('desayuno') }, colacion: { filled: fillMeal('colacion') }, comida: { filled: fillMeal('comida') }, cena: { filled: fillMeal('cena') } })

describe('compliance', () => {
  it('percent over 7 days and streak', () => {
    const logs = [0, 1, 2, 3].map((k) => log(addDays('2026-11-03', -k), { meals: fullMeals() }))
    // today + 3 previous full, 3 days empty → 4 × 32 / (7 × 32)
    expect(compliance(logs, '2026-11-03', '2026-10-01')).toEqual({ pct: 57, streak: 4 })
    // today not complete yet: the streak runs through yesterday
    const partial = [...logs.slice(1), log('2026-11-03', { meals: { pre: { filled: { F: 1 } } } })]
    expect(compliance(partial, '2026-11-03', '2026-10-01').streak).toBe(3)
    // days before the start date don't count
    expect(compliance(logs, '2026-11-03', '2026-11-02')).toEqual({ pct: 100, streak: 2 })
  })
})

describe('records', () => {
  const s = (exerciseId: string, weightKg: number, reps: number, extra: Partial<SetLog> = {}): SetLog => ({
    id: Math.random().toString(), sessionId: 'x', exerciseId, setIndex: 0, weightKg, reps, done: true, ...sync, ...extra,
  })
  it('heaviest weight with at least the bottom of the range', () => {
    const r = records(
      [s('press-banca', 80, 8), s('press-banca', 85, 5), s('press-banca', 80, 10), s('sentadilla', 100, 9), s('sentadilla', 120, 12, { deleted: 1 })],
      ['press-banca', 'sentadilla', 'peso-muerto'],
    )
    expect(r).toEqual([
      { exerciseId: 'press-banca', weightKg: 80, reps: 10 },
      { exerciseId: 'sentadilla', weightKg: 100, reps: 9 },
    ])
  })
})

describe('suggestions (CONTENT §11)', () => {
  const base = { date: '2026-11-03', startDate: START, logs: [0, 1, 2, 3].map((k) => log(addDays('2026-11-03', -k))), sessions: [] as WorkoutSession[] }
  const ids = (x: Parameters<typeof suggestions>[0]) => suggestions(x).map((s) => s.id)

  it('none for a steady, well-logged plan', () => {
    expect(ids({ ...base, weighIns: weighIns(fourWeeks()) })).toEqual([])
  })

  it('plateau: weekly average not dropping for 2 weeks with 4+ weigh-ins', () => {
    const flat = weighIns([0, 1, 2].flatMap((wk) => [0, 1, 2, 3].map((d) => m(addDays('2026-10-12', wk * 7 + d), 98 + wk * 0.1))))
    expect(ids({ ...base, weighIns: flat })).toContain('plateau')
  })

  it('too fast after day 28: more than 1.5 kg/week twice', () => {
    const fast = weighIns([0, 1, 2].flatMap((wk) => [0, 1, 2, 3].map((d) => m(addDays('2026-10-12', wk * 7 + d), 100 - wk * 2))))
    expect(ids({ ...base, weighIns: fast })).toContain('tooFast')
    expect(ids({ ...base, date: '2026-11-01', weighIns: fast })).not.toContain('tooFast')
  })

  it('few weigh-ins last week', () => {
    const few = weighIns([m('2026-10-26', 97), m('2026-10-28', 96.8)])
    expect(ids({ ...base, weighIns: few })).toContain('fewWeighIns')
  })

  it('3 days of low water and late sleep', () => {
    const bad = [1, 2, 3].map((k) => log(addDays('2026-11-03', -k), { waterMl: 1500, habits: { pre: true, gym: true, gymCardio: true, homeCardio: true, sleepOnTime: false } }))
    expect(ids({ ...base, weighIns: weighIns(fourWeeks()), logs: bad })).toEqual(['lowWater', 'lateSleep'])
    // not in the first 3 days of the plan
    expect(ids({ ...base, startDate: '2026-11-02', weighIns: [], logs: bad })).toEqual([])
  })

  it('2 gym sessions over 80 min in the week', () => {
    const sess = (date: string, min: number): WorkoutSession => ({ id: date, date, dayKey: 'lun', startedAt: 0, endedAt: min * 60_000, ...sync })
    expect(ids({ ...base, weighIns: weighIns(fourWeeks()), sessions: [sess('2026-11-02', 85), sess('2026-10-30', 90)] })).toContain('longSessions')
    expect(ids({ ...base, weighIns: weighIns(fourWeeks()), sessions: [sess('2026-11-02', 85), sess('2026-10-20', 90)] })).not.toContain('longSessions')
  })
})

describe('weekGrid', () => {
  it('summarizes each day of the week', () => {
    const logs = [log('2026-11-04', { meals: { comida: { filled: fillMeal('comida') }, cena: { filled: { P: 1 } } }, waterMl: 2500, habits: { pre: true, gym: false, gymCardio: false, homeCardio: false, sleepOnTime: true } })]
    const sessions: WorkoutSession[] = [{ id: 's', date: '2026-11-04', dayKey: 'mie', startedAt: 0, endedAt: 1, ...sync }]
    const cardio = [{ id: 'c', date: '2026-11-04', kind: 'post' as const, minutes: 20, completed: true, ...sync }]
    const g = weekGrid('2026-11-02', '2026-11-04', logs, sessions, cardio)
    expect(g).toHaveLength(7)
    expect(g[2]).toMatchObject({ date: '2026-11-04', waterMl: 2500, gym: true, postCardio: true, homeCardio: false, sleepOnTime: true, future: false })
    expect(g[2]!.meals).toEqual({ pre: false, desayuno: false, colacion: false, comida: true, cena: false })
    expect(g[3]!.future).toBe(true)
  })
})
