// PROGRESO math: averages, pace, weekly table, records, compliance and §11 suggestions.
import { EXERCISE_BY_ID } from '../data/routines'
import { SUGGESTION_THRESHOLDS as T, SUGGESTIONS } from '../data/rules'
import type { SuggestionId } from '../data/rules'
import type { BodyMetric, DailyLog, SetLog, WorkoutSession } from '../db/schema'
import { dayProgress } from './blocks'
import { addDays, daysBetween, planDay, weekStartOf } from './dates'

const r2 = (n: number) => Math.round(n * 100) / 100
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

type W = { date: string; weightKg: number }

export const weighIns = (metrics: BodyMetric[]): W[] =>
  metrics
    .filter((m) => !m.deleted && typeof m.weightKg === 'number')
    .map((m) => ({ date: m.date, weightKg: m.weightKg! }))
    .sort((a, b) => a.date.localeCompare(b.date))

/** Mean of the weigh-ins in [date − 6, date]. */
export function avg7(ws: W[], date: string): number | null {
  const from = addDays(date, -6)
  const m = mean(ws.filter((w) => w.date >= from && w.date <= date).map((w) => w.weightKg))
  return m === null ? null : r2(m)
}

export type Stats = {
  latest: W | null
  avg7: number | null
  start: number | null
  fromStart: number | null
  toGoal: number | null
  /** kg per week: today's 7-day average minus the one 7 days earlier. */
  pace: number | null
}

export function stats(ws: W[], date: string, goalKg: number): Stats {
  const latest = ws.filter((w) => w.date <= date).at(-1) ?? null
  const a = avg7(ws, date)
  const start = ws[0]?.weightKg ?? null
  const prev = avg7(ws, addDays(date, -7))
  return {
    latest,
    avg7: a,
    start,
    fromStart: a !== null && start !== null ? r2(a - start) : null,
    toGoal: a !== null ? r2(a - goalKg) : null,
    pace: a !== null && prev !== null ? r2(a - prev) : null,
  }
}

export type WeekRow = { weekStart: string; avg: number; count: number; diff: number | null; index: number }

/** One row per Monday–Sunday week with weigh-ins, oldest first. Index counts from the plan start. */
export function weeklyTable(ws: W[], startDate: string | null): WeekRow[] {
  const byWeek = new Map<string, number[]>()
  for (const w of ws) {
    const k = weekStartOf(w.date)
    byWeek.set(k, [...(byWeek.get(k) ?? []), w.weightKg])
  }
  const first = weekStartOf(startDate ?? ws[0]?.date ?? '2000-01-03')
  const rows: WeekRow[] = []
  for (const k of [...byWeek.keys()].sort()) {
    const vals = byWeek.get(k)!
    const avg = r2(mean(vals)!)
    const prev = rows.at(-1)
    const contiguous = prev && addDays(prev.weekStart, 7) === k
    rows.push({ weekStart: k, avg, count: vals.length, diff: contiguous ? r2(avg - prev.avg) : null, index: Math.floor(daysBetween(first, k) / 7) + 1 })
  }
  return rows
}

/** Trailing 7-day average for every day with a weigh-in (the chart line). */
export const avgSeries = (ws: W[]) => ws.map((w) => ({ date: w.date, avg: avg7(ws, w.date)! }))

// ---- Gym records ----

export type GymRecord = { exerciseId: string; weightKg: number; reps: number }

/** Heaviest weight lifted with valid reps (at least the bottom of the range). */
export function records(sets: SetLog[], exerciseIds: readonly string[]): GymRecord[] {
  const out: GymRecord[] = []
  for (const id of exerciseIds) {
    const e = EXERCISE_BY_ID.get(id)
    const minReps = e?.reps.kind === 'range' ? e.reps.min : e?.reps.kind === 'fixed' ? e.reps.reps : 1
    let best: GymRecord | null = null
    for (const s of sets) {
      if (s.exerciseId !== id || s.deleted || !s.done || s.weightKg === undefined || (s.reps ?? 0) < minReps) continue
      if (!best || s.weightKg > best.weightKg || (s.weightKg === best.weightKg && (s.reps ?? 0) > best.reps)) {
        best = { exerciseId: id, weightKg: s.weightKg, reps: s.reps ?? 0 }
      }
    }
    if (best) out.push(best)
  }
  return out
}

// ---- Compliance ----

export type Compliance = { pct: number | null; streak: number }

/** % of blocks filled over the last 7 days (since the plan start) and the full-day streak. */
export function compliance(logs: DailyLog[], date: string, startDate: string | null): Compliance {
  const byDate = new Map(logs.filter((l) => !l.deleted).map((l) => [l.date, l]))
  let done = 0
  let total = 0
  for (let i = 0; i < 7; i++) {
    const d = addDays(date, -i)
    if (startDate && d < startDate) break
    const p = dayProgress(byDate.get(d)?.meals ?? {})
    done += p.done
    total += p.total
  }
  const complete = (d: string) => dayProgress(byDate.get(d)?.meals ?? {}).complete
  // Today counts only once it's complete; otherwise the streak runs through yesterday.
  let d = complete(date) ? date : addDays(date, -1)
  let streak = 0
  while (complete(d) && (!startDate || d >= startDate)) {
    streak++
    d = addDays(d, -1)
  }
  return { pct: total ? Math.round((done / total) * 100) : null, streak }
}

// ---- Suggestions (CONTENT §11) ----

export type SuggestionInput = {
  date: string
  startDate: string | null
  weighIns: W[]
  logs: DailyLog[]
  sessions: WorkoutSession[]
}

export function suggestions(i: SuggestionInput): { id: SuggestionId; message: string }[] {
  const out: SuggestionId[] = []
  const thisWeek = weekStartOf(i.date)
  const weeks = weeklyTable(i.weighIns, i.startDate).filter((w) => w.weekStart < thisWeek)
  const day = i.startDate ? planDay(i.startDate, i.date) : 0

  // Last 3 complete weeks, consecutive.
  const last3 = weeks.slice(-3)
  const consecutive = last3.length === 3 && last3.every((w, k) => k === 0 || addDays(last3[k - 1]!.weekStart, 7) === w.weekStart)
  if (consecutive && last3.every((w) => w.count >= T.minWeighInsPerWeek) && last3[1]!.avg >= last3[0]!.avg && last3[2]!.avg >= last3[1]!.avg) {
    out.push('plateau')
  }

  const last2 = weeks.slice(-2)
  if (day > T.tooFastAfterDay && last2.length === 2 && last2.every((w) => w.diff !== null && w.diff < -T.tooFastKgPerWeek)) {
    out.push('tooFast')
  }

  // Previous complete week, once the plan has run a whole week.
  const prevWeek = addDays(thisWeek, -7)
  if (i.startDate && i.startDate <= prevWeek) {
    const n = i.weighIns.filter((w) => weekStartOf(w.date) === prevWeek).length
    if (n < T.minWeighInsPerWeek) out.push('fewWeighIns')
  }

  // The 3 days before today, all inside the plan.
  const prev3 = [1, 2, 3].map((k) => addDays(i.date, -k))
  if (i.startDate && prev3.every((d) => d >= i.startDate!)) {
    const log = (d: string) => i.logs.find((l) => l.date === d && !l.deleted)
    if (prev3.every((d) => (log(d)?.waterMl ?? 0) < T.lowWaterMl)) out.push('lowWater')
    if (prev3.every((d) => !log(d)?.habits.sleepOnTime)) out.push('lateSleep')
  }

  const weekFrom = addDays(i.date, -6)
  const long = i.sessions.filter(
    (s) => !s.deleted && s.endedAt && s.date >= weekFrom && s.date <= i.date && (s.endedAt - s.startedAt) / 60_000 > T.longSessionMin,
  )
  if (long.length >= T.longSessionsPerWeek) out.push('longSessions')

  return out.map((id) => ({ id, message: SUGGESTIONS[id].message }))
}
