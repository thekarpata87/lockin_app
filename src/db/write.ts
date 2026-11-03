// Every local write goes through here: stamps updatedAt, marks dirty, notifies the sync engine.
import type { Table } from 'dexie'
import { db } from './schema'
import type { SyncFields } from './schema'

type Listener = () => void
const listeners = new Set<Listener>()

/** The sync engine (M8) subscribes here to push ~2 s after writes. */
export function onLocalWrite(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  for (const fn of listeners) fn()
}

/** Strictly increasing per record, even for two writes in the same millisecond. */
export const nextUpdatedAt = (prev?: number) => Math.max(Date.now(), (prev ?? 0) + 1)

type Row = SyncFields & object

/** Insert or replace a whole record. */
export async function putRecord<T extends Row, K>(table: Table<T, K>, record: Omit<T, keyof SyncFields>): Promise<T> {
  const out = await db.transaction('rw', table, async () => {
    const key = (table.schema.primKey.keyPath as string)
    const prev = await table.get((record as Record<string, unknown>)[key] as K)
    const row = { ...record, updatedAt: nextUpdatedAt(prev?.updatedAt), deleted: 0, dirty: 1 } as T
    await table.put(row)
    return row
  })
  notify()
  return out
}

/**
 * Read-modify-write. `create` builds the record when it doesn't exist yet.
 * Returns the stored record.
 */
export async function updateRecord<T extends Row, K>(
  table: Table<T, K>,
  key: K,
  create: () => Omit<T, keyof SyncFields>,
  mutate: (current: T) => Omit<T, keyof SyncFields> | T,
): Promise<T> {
  const out = await db.transaction('rw', table, async () => {
    const prev = await table.get(key)
    const base = (prev && !prev.deleted ? prev : { ...create(), updatedAt: 0, deleted: 0, dirty: 0 }) as T
    const next = { ...mutate(base), updatedAt: nextUpdatedAt(prev?.updatedAt), deleted: 0, dirty: 1 } as T
    await table.put(next)
    return next
  })
  notify()
  return out
}

/** Logical delete (SPEC §5.1): kept locally and synced as a change. */
export async function softDelete<T extends Row, K>(table: Table<T, K>, key: K): Promise<void> {
  await db.transaction('rw', table, async () => {
    const prev = await table.get(key)
    if (!prev) return
    await table.put({ ...prev, deleted: 1, dirty: 1, updatedAt: nextUpdatedAt(prev.updatedAt) })
  })
  notify()
}

export const alive = <T extends SyncFields>(r: T | undefined): T | undefined => (r && !r.deleted ? r : undefined)
