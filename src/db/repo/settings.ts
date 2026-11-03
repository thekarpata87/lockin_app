import { PROFILE, CREATINE_DEFAULT_G } from '../../data/profile'
import { REST_DEFAULT_SEC } from '../../data/routines'
import { db } from '../schema'
import type { SettingsData, SettingsRow } from '../schema'
import { updateRecord } from '../write'

export const DEFAULT_SETTINGS: SettingsData = {
  startDate: null,
  heightCm: PROFILE.heightCm,
  goalKg: PROFILE.goalKg,
  wakeTime: '05:15',
  sleepTime: '22:00',
  sleepRamp: false,
  sleepRampStart: null,
  restSec: REST_DEFAULT_SEC,
  reducedVolume: false,
  creatineG: CREATINE_DEFAULT_G,
  theme: 'system',
}

/** Stored settings merged over defaults (new fields get defaults). */
export async function getSettings(): Promise<SettingsData> {
  const row = await db.settings.get('me')
  return { ...DEFAULT_SETTINGS, ...(row && !row.deleted ? row.data : {}) }
}

export function updateSettings(patch: Partial<SettingsData>): Promise<SettingsRow> {
  return updateRecord(
    db.settings,
    'me',
    () => ({ id: 'me', data: { ...DEFAULT_SETTINGS } }),
    (cur) => ({ ...cur, data: { ...DEFAULT_SETTINGS, ...cur.data, ...patch } }),
  )
}

/**
 * Timestamp for settings the app creates by itself (first launch, defaults). It's older than
 * anything a person writes, so settings already in Supabase always win on the first sync.
 */
export const BOOTSTRAP_UPDATED_AT = 1

/** First launch: the plan starts today. No-op once set. */
export async function ensureStartDate(todayIso: string): Promise<string> {
  const row = await db.settings.get('me')
  if (row?.data.startDate) return row.data.startDate
  if (!row) {
    await db.settings.put({ id: 'me', data: { ...DEFAULT_SETTINGS, startDate: todayIso }, updatedAt: BOOTSTRAP_UPDATED_AT, deleted: 0, dirty: 1 })
    return todayIso
  }
  await updateSettings({ startDate: todayIso })
  return todayIso
}
