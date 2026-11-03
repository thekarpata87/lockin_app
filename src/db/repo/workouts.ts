import Dexie from 'dexie'
import type { GymDayKey } from '../../data/routines'
import { db } from '../schema'
import type { SetLog, WorkoutSession } from '../schema'
import { alive, putRecord, softDelete, updateRecord } from '../write'

export function startSession(date: string, dayKey: GymDayKey, now = Date.now()): Promise<WorkoutSession> {
  return putRecord(db.workoutSessions, { id: crypto.randomUUID(), date, dayKey, startedAt: now })
}

export function updateSession(id: string, patch: Partial<Omit<WorkoutSession, 'id'>>): Promise<WorkoutSession> {
  return updateRecord(
    db.workoutSessions,
    id,
    () => {
      throw new Error(`Unknown session ${id}`)
    },
    (cur) => ({ ...cur, ...patch }),
  )
}

export const endSession = (id: string, cardioMin?: number, now = Date.now()) =>
  updateSession(id, { endedAt: now, ...(cardioMin !== undefined ? { cardioMin } : {}) })

export async function getSession(id: string) {
  return alive(await db.workoutSessions.get(id))
}

export async function sessionsOn(date: string): Promise<WorkoutSession[]> {
  return (await db.workoutSessions.where('date').equals(date).toArray()).filter((s) => !s.deleted)
}

export type SetInput = Omit<SetLog, 'id' | 'updatedAt' | 'deleted' | 'dirty'>

export function saveSet(input: SetInput, id: string = crypto.randomUUID()): Promise<SetLog> {
  return putRecord(db.setLogs, { ...input, id })
}

export const deleteSet = (id: string) => softDelete(db.setLogs, id)

const bySetOrder = (a: SetLog, b: SetLog) => a.setIndex - b.setIndex || (a.side ?? '').localeCompare(b.side ?? '')

export async function setsForSession(sessionId: string): Promise<SetLog[]> {
  const rows = await db.setLogs.where('sessionId').equals(sessionId).toArray()
  return rows.filter((s) => !s.deleted).sort(bySetOrder)
}

/**
 * "Última vez": the sets of this exercise from the most recently touched other session.
 */
export async function lastSetsForExercise(exerciseId: string, excludeSessionId?: string): Promise<SetLog[]> {
  const recent = await db.setLogs
    .where('[exerciseId+updatedAt]')
    .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
    .reverse()
    .filter((s) => !s.deleted && s.sessionId !== excludeSessionId)
    .first()
  if (!recent) return []
  const all = await db.setLogs.where('sessionId').equals(recent.sessionId).toArray()
  return all.filter((s) => !s.deleted && s.exerciseId === exerciseId).sort(bySetOrder)
}
