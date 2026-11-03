// Dexie schema (SPEC §5.2). IndexedDB is the source of truth on the phone.
import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { CardioKind } from '../data/cardio'
import type { GymDayKey } from '../data/routines'
import type { Blocks, DayKey, MealKey } from '../data/types'

/** Common sync fields. 0|1 instead of boolean because IndexedDB can't index booleans. */
export type SyncFields = {
  /** Client ms; strictly increases per record ("last write wins"). */
  updatedAt: number
  deleted: 0 | 1
  dirty: 0 | 1
}

export type Theme = 'system' | 'light' | 'dark'

export type SettingsData = {
  /** YYYY-MM-DD; set on first launch. */
  startDate: string | null
  heightCm: number
  goalKg: number
  wakeTime: string
  sleepTime: string
  sleepRamp: boolean
  /** First night of the gradual sleep ramp (YYYY-MM-DD). */
  sleepRampStart: string | null
  restSec: number
  reducedVolume: boolean
  creatineG: number
  theme: Theme
}

export type SettingsRow = SyncFields & { id: 'me'; data: SettingsData }

export type BodyMetric = SyncFields & { date: string; weightKg?: number; waistCm?: number; note?: string }

/** recipeId: undefined = follow the weekly plan; null = "Armar con bloques" for that day. */
export type MealLog = { recipeId?: string | null; filled: Blocks }

export type Habits = { pre: boolean; gym: boolean; gymCardio: boolean; homeCardio: boolean; sleepOnTime: boolean }

export type DailyLog = SyncFields & {
  date: string
  meals: Partial<Record<MealKey, MealLog>>
  waterMl: number
  steps?: number
  habits: Habits
  flexMeal: boolean
}

export type WorkoutSession = SyncFields & {
  id: string
  date: string
  dayKey: GymDayKey
  startedAt: number
  endedAt?: number
  notes?: string
  cardioMin?: number
}

export type SetLog = SyncFields & {
  id: string
  sessionId: string
  exerciseId: string
  setIndex: number
  side?: 'izq' | 'der'
  weightKg?: number
  reps?: number
  done: boolean
}

export type CardioLog = SyncFields & {
  id: string
  date: string
  kind: CardioKind
  minutes: number
  completed: boolean
}

/** Recipe ids by day and meal. Picks are the recipes chosen for the week (SPEC §4.2). */
export type WeekPlan = {
  picks: { desayuno: string[]; colacion: string[]; comida: string[]; cena: string[] }
  days: Partial<Record<DayKey, Partial<Record<Exclude<MealKey, 'pre'>, string>>>>
  /** "Cambiar proteína" for the week: recipeId → { fromFoodId: toFoodId }. */
  swaps?: Record<string, Record<string, string>>
}

export type WeeklyPlan = SyncFields & { weekStart: string; plan: WeekPlan; shoppingChecked: string[] }

export type MetaRow = { key: string; value: unknown }

export class BloqueDB extends Dexie {
  settings!: Table<SettingsRow, SettingsRow['id']>
  bodyMetrics!: Table<BodyMetric, BodyMetric['date']>
  dailyLogs!: Table<DailyLog, DailyLog['date']>
  workoutSessions!: Table<WorkoutSession, WorkoutSession['id']>
  setLogs!: Table<SetLog, SetLog['id']>
  cardioSessions!: Table<CardioLog, CardioLog['id']>
  weeklyPlans!: Table<WeeklyPlan, WeeklyPlan['weekStart']>
  meta!: Table<MetaRow, MetaRow['key']>

  constructor(name = 'bloque') {
    super(name)
    this.version(1).stores({
      settings: 'id, dirty',
      bodyMetrics: 'date, dirty',
      dailyLogs: 'date, dirty',
      workoutSessions: 'id, date, dirty',
      setLogs: 'id, sessionId, [exerciseId+updatedAt], dirty',
      cardioSessions: 'id, date, dirty',
      weeklyPlans: 'weekStart, dirty',
      meta: 'key',
    })
  }
}

export const db = new BloqueDB()

/** Tables that sync, in push order (SPEC §5.4). */
export const SYNC_TABLES = [
  'settings',
  'workoutSessions',
  'setLogs',
  'bodyMetrics',
  'dailyLogs',
  'cardioSessions',
  'weeklyPlans',
] as const

export type SyncTableName = (typeof SYNC_TABLES)[number]
