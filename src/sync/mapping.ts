// Local (Dexie, camelCase) ↔ remote (Supabase, snake_case) rows, per table (SPEC §5.2–§5.3).
import type { SyncTableName } from '../db/schema'

export type RemoteRow = Record<string, unknown> & { updated_at: number; deleted: boolean; server_updated_at?: string }
type LocalRow = Record<string, unknown> & { updatedAt: number; deleted: 0 | 1; dirty: 0 | 1 }

type FieldMap = readonly (readonly [local: string, remote: string])[]

export type TableMap = {
  remote: string
  /** Local primary key field. */
  key: string
  /** Upsert conflict target. */
  onConflict: string
  fields: FieldMap
}

export const TABLES: Record<SyncTableName, TableMap> = {
  settings: { remote: 'settings', key: 'id', onConflict: 'user_id', fields: [['data', 'data']] },
  bodyMetrics: {
    remote: 'body_metrics',
    key: 'date',
    onConflict: 'user_id,date',
    fields: [['date', 'date'], ['weightKg', 'weight_kg'], ['waistCm', 'waist_cm'], ['note', 'note']],
  },
  dailyLogs: {
    remote: 'daily_logs',
    key: 'date',
    onConflict: 'user_id,date',
    fields: [['date', 'date'], ['meals', 'meals'], ['waterMl', 'water_ml'], ['steps', 'steps'], ['habits', 'habits'], ['flexMeal', 'flex_meal']],
  },
  workoutSessions: {
    remote: 'workout_sessions',
    key: 'id',
    onConflict: 'id',
    fields: [['id', 'id'], ['date', 'date'], ['dayKey', 'day_key'], ['startedAt', 'started_at'], ['endedAt', 'ended_at'], ['notes', 'notes'], ['cardioMin', 'cardio_min']],
  },
  setLogs: {
    remote: 'set_logs',
    key: 'id',
    onConflict: 'id',
    fields: [['id', 'id'], ['sessionId', 'session_id'], ['exerciseId', 'exercise_id'], ['setIndex', 'set_index'], ['side', 'side'], ['weightKg', 'weight_kg'], ['reps', 'reps'], ['done', 'done']],
  },
  cardioSessions: {
    remote: 'cardio_sessions',
    key: 'id',
    onConflict: 'id',
    fields: [['id', 'id'], ['date', 'date'], ['kind', 'kind'], ['minutes', 'minutes'], ['completed', 'completed']],
  },
  weeklyPlans: {
    remote: 'weekly_plans',
    key: 'weekStart',
    onConflict: 'user_id,week_start',
    fields: [['weekStart', 'week_start'], ['plan', 'plan'], ['shoppingChecked', 'shopping_checked']],
  },
}

export function toRemote(table: SyncTableName, row: LocalRow, userId: string): RemoteRow {
  const out: RemoteRow = { user_id: userId, updated_at: row.updatedAt, deleted: row.deleted === 1 }
  for (const [l, r] of TABLES[table].fields) out[r] = row[l] ?? null
  return out
}

export function toLocal(table: SyncTableName, row: RemoteRow): LocalRow {
  const out: LocalRow = { updatedAt: Number(row.updated_at), deleted: row.deleted ? 1 : 0, dirty: 0 }
  if (table === 'settings') out.id = 'me'
  for (const [l, r] of TABLES[table].fields) {
    const v = row[r]
    if (v === null || v === undefined) continue
    // numeric columns can come back as strings
    out[l] = typeof v === 'string' && /^(weight_kg|waist_cm)$/.test(r) ? Number(v) : v
  }
  return out
}

/** "Last write wins" (SPEC §5.1): take the remote row unless the local one is dirty and newer or equal. */
export function shouldApplyRemote(local: { updatedAt: number; dirty: 0 | 1 } | undefined, remoteUpdatedAt: number): boolean {
  return !local || local.dirty === 0 || remoteUpdatedAt > local.updatedAt
}
