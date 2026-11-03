// Gym logic: progress within a session, "última vez", progression hints, prefill and summary.
import { INCREMENT_KG, setsFor } from '../data/routines'
import type { Exercise } from '../data/routines'
import type { SetLog } from '../db/schema'

export type Side = 'izq' | 'der'

/** Reps only: bodyweight and to-failure. 21s: weight + completed. */
export const logsWeight = (e: Exercise) => e.equipment !== 'corporal'
export const logsReps = (e: Exercise) => e.reps.kind !== '21s'

export const targetSets = (e: Exercise, reducedVolume: boolean) => setsFor(e, reducedVolume)

/** A series is complete when it has one row (or both sides for unilateral). */
export function completedSeries(e: Exercise, sets: SetLog[]): number {
  const byIndex = new Map<number, Set<string>>()
  for (const s of sets) {
    if (s.exerciseId !== e.id || s.deleted) continue
    const sides = byIndex.get(s.setIndex) ?? new Set()
    sides.add(s.side ?? '-')
    byIndex.set(s.setIndex, sides)
  }
  let n = 0
  for (const sides of byIndex.values()) if (!e.unilateral || (sides.has('izq') && sides.has('der'))) n++
  return n
}

/** Where the next save goes: series index and, for unilateral, which side is missing. */
export function nextSlot(e: Exercise, sets: SetLog[]): { setIndex: number; side?: Side } {
  const mine = sets.filter((s) => s.exerciseId === e.id && !s.deleted)
  if (!e.unilateral) return { setIndex: mine.length ? Math.max(...mine.map((s) => s.setIndex)) + 1 : 0 }
  const indexes = [...new Set(mine.map((s) => s.setIndex))].sort((a, b) => a - b)
  for (const i of indexes) {
    const sides = new Set(mine.filter((s) => s.setIndex === i).map((s) => s.side))
    if (!sides.has('izq')) return { setIndex: i, side: 'izq' }
    if (!sides.has('der')) return { setIndex: i, side: 'der' }
  }
  return { setIndex: indexes.length ? indexes[indexes.length - 1]! + 1 : 0, side: 'izq' }
}

const kg = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''))

/** "22.5 kg × 12, 12, 11" · "10 kg × 15/15, 15/14" · "× 20, 18" · "20 kg · 4/4 completas". */
export function formatSets(e: Exercise, sets: SetLog[]): string {
  const rows = sets.filter((s) => !s.deleted).sort((a, b) => a.setIndex - b.setIndex || (a.side ?? '').localeCompare(b.side ?? ''))
  if (!rows.length) return ''
  if (e.reps.kind === '21s') {
    const w = rows.map((r) => r.weightKg ?? 0)
    return `${kg(Math.max(...w))} kg · ${rows.filter((r) => r.done).length}/${rows.length} completas`
  }
  const groups = new Map<number, SetLog[]>()
  for (const r of rows) groups.set(r.setIndex, [...(groups.get(r.setIndex) ?? []), r])
  const series = [...groups.values()]
  const repsOf = (g: SetLog[]) =>
    e.unilateral
      ? ['izq', 'der'].map((side) => g.find((r) => r.side === side)?.reps ?? '–').join('/')
      : String(g[0]?.reps ?? '–')
  if (!logsWeight(e)) return `× ${series.map(repsOf).join(', ')}`
  const weights = new Set(rows.map((r) => r.weightKg ?? 0))
  if (weights.size === 1) return `${kg([...weights][0]!)} kg × ${series.map(repsOf).join(', ')}`
  return series.map((g) => `${kg(g[0]?.weightKg ?? 0)}×${repsOf(g)}`).join(', ')
}

export type Suggestion = { kind: 'up'; weightKg: number } | { kind: 'nextPlate' }

/**
 * If every series last time reached the top of the range (or the fixed reps), suggest the
 * equipment increment. No hint for bodyweight, to-failure or 21s.
 */
export function progression(e: Exercise, lastSets: SetLog[], reducedVolume: boolean): Suggestion | null {
  if (!logsWeight(e) || e.reps.kind === 'failure' || e.reps.kind === '21s') return null
  const top = e.reps.kind === 'range' ? e.reps.max : e.reps.reps
  const rows = lastSets.filter((s) => !s.deleted && s.exerciseId === e.id)
  if (completedSeries(e, rows) < targetSets(e, reducedVolume)) return null
  if (!rows.every((r) => (r.reps ?? 0) >= top)) return null
  const inc = INCREMENT_KG[e.equipment]
  if (inc === null) return { kind: 'nextPlate' }
  return { kind: 'up', weightKg: Math.max(...rows.map((r) => r.weightKg ?? 0)) + inc }
}

export const suggestionText = (s: Suggestion | null) =>
  !s ? null : s.kind === 'up' ? `Sube a ${kg(s.weightKg)} kg` : 'Sube a la siguiente placa'

const DEFAULT_KG: Record<Exercise['equipment'], number> = { barra: 20, mancuerna: 10, maquina: 20, polea: 20, corporal: 0 }

export function defaultReps(e: Exercise): number {
  switch (e.reps.kind) {
    case 'range':
      return Math.round((e.reps.min + e.reps.max) / 2)
    case 'fixed':
      return e.reps.reps
    case 'failure':
      return 15
    case '21s':
      return 21
  }
}

const latestFirst = (a: SetLog, b: SetLog) => b.updatedAt - a.updatedAt

/**
 * Stepper preload: the latest set of this exercise in the current session; otherwise
 * last time's latest set (weight raised to the suggestion, if any); otherwise defaults.
 */
export function prefill(e: Exercise, current: SetLog[], last: SetLog[], suggestion: Suggestion | null): { weightKg: number; reps: number } {
  const mine = current.filter((s) => s.exerciseId === e.id && !s.deleted).sort(latestFirst)[0]
  if (mine) return { weightKg: mine.weightKg ?? DEFAULT_KG[e.equipment], reps: mine.reps ?? defaultReps(e) }
  const prev = last.filter((s) => !s.deleted).sort(latestFirst)[0]
  if (prev) {
    const w = suggestion?.kind === 'up' ? suggestion.weightKg : (prev.weightKg ?? DEFAULT_KG[e.equipment])
    return { weightKg: w, reps: prev.reps ?? defaultReps(e) }
  }
  return { weightKg: DEFAULT_KG[e.equipment], reps: defaultReps(e) }
}

export const weightStep = (e: Exercise) => (e.equipment === 'mancuerna' ? 2 : 2.5)

export function repsLabel(e: Exercise, reducedVolume: boolean): string {
  const n = targetSets(e, reducedVolume)
  const per = e.unilateral ? (e.id.startsWith('remo') ? ' por brazo' : ' por pierna') : ''
  switch (e.reps.kind) {
    case 'range':
      return `${n} × ${e.reps.min}–${e.reps.max}${per}`
    case 'fixed':
      return `${n} × ${e.reps.reps}${per}`
    case 'failure':
      return `${n} × al fallo`
    case '21s':
      return `${n} series de 7 + 7 + 7`
  }
}

/** Duration (min), series and total volume (kg × reps; 21s count 21 reps when completed). */
export function sessionSummary(sets: SetLog[], startedAt: number, endedAt: number) {
  const rows = sets.filter((s) => !s.deleted)
  const volume = rows.reduce((v, s) => v + (s.weightKg ?? 0) * (s.reps ?? 0), 0)
  const series = new Set(rows.map((s) => `${s.exerciseId}:${s.setIndex}`)).size
  return { minutes: Math.max(0, Math.round((endedAt - startedAt) / 60_000)), series, volumeKg: Math.round(volume) }
}
