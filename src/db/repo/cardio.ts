import type { CardioKind } from '../../data/cardio'
import { db } from '../schema'
import type { CardioLog } from '../schema'
import { putRecord, softDelete } from '../write'

export function saveCardioSession(
  input: { date: string; kind: CardioKind; minutes: number; completed: boolean },
  id: string = crypto.randomUUID(),
): Promise<CardioLog> {
  return putRecord(db.cardioSessions, { ...input, minutes: Math.round(input.minutes), id })
}

export async function cardioOn(date: string): Promise<CardioLog[]> {
  return (await db.cardioSessions.where('date').equals(date).toArray()).filter((c) => !c.deleted)
}

export async function listCardio(from: string, to: string): Promise<CardioLog[]> {
  return (await db.cardioSessions.where('date').between(from, to, true, true).toArray()).filter((c) => !c.deleted)
}

export const deleteCardioSession = (id: string) => softDelete(db.cardioSessions, id)
