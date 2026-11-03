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

/** First launch: the plan starts today. No-op once set. */
export async function ensureStartDate(todayIso: string): Promise<string> {
  const s = await getSettings()
  if (s.startDate) return s.startDate
  await updateSettings({ startDate: todayIso })
  return todayIso
}
