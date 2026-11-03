import { db } from '../schema'
import type { BodyMetric } from '../schema'
import { alive, softDelete, updateRecord } from '../write'

export type MetricInput = { weightKg?: number; waistCm?: number; note?: string }

export function saveBodyMetric(date: string, input: MetricInput): Promise<BodyMetric> {
  return updateRecord(db.bodyMetrics, date, () => ({ date }), (cur) => ({ ...cur, ...input }))
}

export async function getBodyMetric(date: string) {
  return alive(await db.bodyMetrics.get(date))
}

/** Inclusive range, oldest first. */
export async function listBodyMetrics(from: string, to: string): Promise<BodyMetric[]> {
  const rows = await db.bodyMetrics.where('date').between(from, to, true, true).toArray()
  return rows.filter((r) => !r.deleted)
}

export const deleteBodyMetric = (date: string) => softDelete(db.bodyMetrics, date)

/** Most recent weigh-in, for preloading the stepper. */
export async function latestBodyMetric(): Promise<BodyMetric | undefined> {
  const rows = await db.bodyMetrics.orderBy('date').reverse().filter((r) => !r.deleted && r.weightKg !== undefined).limit(1).toArray()
  return rows[0]
}

export async function allBodyMetrics(): Promise<BodyMetric[]> {
  return (await db.bodyMetrics.orderBy('date').toArray()).filter((r) => !r.deleted)
}
