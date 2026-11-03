import { describe, expect, it } from 'vitest'
import { EXERCISE_BY_ID } from '../data/routines'
import type { SetLog } from '../db/schema'
import { completedSeries, formatSets, nextSlot, prefill, progression, repsLabel, sessionSummary, suggestionText } from './gym'

const ex = (id: string) => EXERCISE_BY_ID.get(id)!
let t = 1
const set = (exerciseId: string, setIndex: number, weightKg: number | undefined, reps: number | undefined, extra: Partial<SetLog> = {}): SetLog => ({
  id: `s${t}`, sessionId: 'a', exerciseId, setIndex, weightKg, reps, done: true, updatedAt: t++, deleted: 0, dirty: 1, ...extra,
})

describe('series and slots', () => {
  it('bilateral: next index after the highest', () => {
    const e = ex('press-banca')
    const s = [set('press-banca', 0, 60, 12), set('press-banca', 1, 60, 11)]
    expect(completedSeries(e, s)).toBe(2)
    expect(nextSlot(e, s)).toEqual({ setIndex: 2 })
    expect(nextSlot(e, [])).toEqual({ setIndex: 0 })
  })

  it('unilateral: izq then der, then next series', () => {
    const e = ex('remo-mancuerna')
    expect(nextSlot(e, [])).toEqual({ setIndex: 0, side: 'izq' })
    const a = [set('remo-mancuerna', 0, 20, 15, { side: 'izq' })]
    expect(completedSeries(e, a)).toBe(0)
    expect(nextSlot(e, a)).toEqual({ setIndex: 0, side: 'der' })
    const b = [...a, set('remo-mancuerna', 0, 20, 15, { side: 'der' })]
    expect(completedSeries(e, b)).toBe(1)
    expect(nextSlot(e, b)).toEqual({ setIndex: 1, side: 'izq' })
  })
})

describe('formatSets', () => {
  it('same weight', () => {
    expect(formatSets(ex('press-mancuerna-neutral'), [22.5, 22.5, 22.5].map((w, i) => set('press-mancuerna-neutral', i, w, [12, 11, 9][i])))).toBe('22.5 kg × 12, 11, 9')
  })
  it('mixed weights, bodyweight, unilateral and 21s', () => {
    expect(formatSets(ex('press-banca'), [set('press-banca', 0, 60, 12), set('press-banca', 1, 62.5, 10)])).toBe('60×12, 62.5×10')
    expect(formatSets(ex('push-ups'), [set('push-ups', 0, undefined, 20), set('push-ups', 1, undefined, 16)])).toBe('× 20, 16')
    expect(
      formatSets(ex('bulgaro'), [set('bulgaro', 0, 12, 10, { side: 'izq' }), set('bulgaro', 0, 12, 9, { side: 'der' })]),
    ).toBe('12 kg × 10/9')
    expect(formatSets(ex('curl-21s'), [set('curl-21s', 0, 20, 21), set('curl-21s', 1, 20, 0, { done: false })])).toBe('20 kg · 1/2 completas')
  })
})

describe('progression', () => {
  const five = (id: string, w: number, reps: number[]) => reps.map((r, i) => set(id, i, w, r))

  it('all series at the top of the range → increment by equipment', () => {
    expect(progression(ex('press-banca'), five('press-banca', 60, [12, 12, 12, 12, 12]), false)).toEqual({ kind: 'up', weightKg: 62.5 })
    expect(progression(ex('laterales'), five('laterales', 8, [12, 12, 12, 12, 12]), false)).toEqual({ kind: 'up', weightKg: 10 })
    expect(progression(ex('pec-dec'), five('pec-dec', 40, [12, 12, 12, 12, 12]), false)).toEqual({ kind: 'nextPlate' })
  })

  it('no hint when a series misses the top or series are missing', () => {
    expect(progression(ex('press-banca'), five('press-banca', 60, [12, 12, 12, 12, 11]), false)).toBeNull()
    expect(progression(ex('press-banca'), five('press-banca', 60, [12, 12, 12, 12]), false)).toBeNull()
  })

  it('reduced volume needs only 4 series', () => {
    expect(progression(ex('press-banca'), five('press-banca', 60, [12, 12, 12, 12]), true)).toEqual({ kind: 'up', weightKg: 62.5 })
  })

  it('never for bodyweight, failure or 21s', () => {
    expect(progression(ex('push-ups'), five('push-ups', 0, [30, 30, 30, 30]), false)).toBeNull()
    expect(progression(ex('curl-21s'), five('curl-21s', 20, [21, 21, 21, 21]), false)).toBeNull()
  })

  it('text', () => {
    expect(suggestionText({ kind: 'up', weightKg: 24 })).toBe('Sube a 24 kg')
    expect(suggestionText({ kind: 'nextPlate' })).toBe('Sube a la siguiente placa')
    expect(suggestionText(null)).toBeNull()
  })
})

describe('prefill', () => {
  const e = ex('press-banca')
  it('current session first, then last time (with suggestion), then defaults', () => {
    const last = [set('press-banca', 0, 60, 12), set('press-banca', 4, 60, 12)]
    expect(prefill(e, [set('press-banca', 0, 62.5, 9)], last, null)).toEqual({ weightKg: 62.5, reps: 9 })
    expect(prefill(e, [], last, null)).toEqual({ weightKg: 60, reps: 12 })
    expect(prefill(e, [], last, { kind: 'up', weightKg: 62.5 })).toEqual({ weightKg: 62.5, reps: 12 })
    expect(prefill(e, [], [], null)).toEqual({ weightKg: 20, reps: 10 })
  })
})

describe('labels and summary', () => {
  it('reps label', () => {
    expect(repsLabel(ex('press-banca'), false)).toBe('5 × 8–12')
    expect(repsLabel(ex('press-banca'), true)).toBe('4 × 8–12')
    expect(repsLabel(ex('remo-mancuerna'), false)).toBe('4 × 15 por brazo')
    expect(repsLabel(ex('bulgaro'), false)).toBe('4 × 10 por pierna')
    expect(repsLabel(ex('push-ups'), false)).toBe('4 × al fallo')
  })

  it('summary', () => {
    const s = [set('press-banca', 0, 60, 10), set('press-banca', 1, 60, 10), set('push-ups', 0, undefined, 20)]
    expect(sessionSummary(s, 0, 72 * 60_000)).toEqual({ minutes: 72, series: 3, volumeKg: 1200 })
  })
})
