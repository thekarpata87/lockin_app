// One-time clean start before the plan officially begins (2026-11-04). Runs once per device.
import { db } from './schema'
import { BOOTSTRAP_UPDATED_AT, DEFAULT_SETTINGS } from './repo/settings'

export const OFFICIAL_START = '2026-11-04'
const FLAG = 'reset:official-start'
const LOCAL_KEYS = ['bloque.rest', 'bloque.cardioRun', 'bloque.prep']

/**
 * Before the start date: wipe every test record and mark, and set the plan start to 2026-11-04.
 * On the start date itself: only remove records dated before it (keeps anything logged that day).
 * After it: never runs.
 */
export async function officialStartReset(todayIso: string): Promise<'wiped' | 'trimmed' | 'skipped' | 'already'> {
  if (await db.meta.get(FLAG)) return 'already'
  if (todayIso > OFFICIAL_START) {
    await db.meta.put({ key: FLAG, value: 'skipped' })
    return 'skipped'
  }

  const before = (d: string) => d < OFFICIAL_START
  let result: 'wiped' | 'trimmed'
  await db.transaction('rw', [db.settings, db.bodyMetrics, db.dailyLogs, db.workoutSessions, db.setLogs, db.cardioSessions, db.weeklyPlans, db.meta], async () => {
    if (todayIso < OFFICIAL_START) {
      await Promise.all([db.bodyMetrics.clear(), db.dailyLogs.clear(), db.workoutSessions.clear(), db.setLogs.clear(), db.cardioSessions.clear(), db.weeklyPlans.clear()])
      result = 'wiped'
    } else {
      const old = await db.workoutSessions.filter((s) => before(s.date)).primaryKeys()
      await db.setLogs.where('sessionId').anyOf(old).delete()
      await db.workoutSessions.bulkDelete(old)
      await db.bodyMetrics.where('date').below(OFFICIAL_START).delete()
      await db.dailyLogs.where('date').below(OFFICIAL_START).delete()
      await db.cardioSessions.where('date').below(OFFICIAL_START).delete()
      result = 'trimmed'
    }
    // Settings back to defaults with the official start; old timestamp so the server copy wins if any.
    await db.settings.put({ id: 'me', data: { ...DEFAULT_SETTINGS, startDate: OFFICIAL_START }, updatedAt: BOOTSTRAP_UPDATED_AT, deleted: 0, dirty: 1 })
    for (const k of await db.meta.toCollection().primaryKeys()) if (String(k).startsWith('cursor:') || k === 'lastSyncAt' || k === 'lastError') await db.meta.delete(k)
    await db.meta.put({ key: FLAG, value: { result: result!, at: Date.now() } })
  })
  try {
    for (const k of LOCAL_KEYS) localStorage.removeItem(k)
  } catch {
    // ignore
  }
  return result!
}
