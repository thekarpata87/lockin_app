// Sync engine (SPEC §5.4). IndexedDB stays the source of truth; the network is only for sync.
import { useSyncExternalStore } from 'react'
import type { Table } from 'dexie'
import { db, SYNC_TABLES } from '../db/schema'
import type { SyncTableName } from '../db/schema'
import { onLocalWrite } from '../db/write'
import { shouldApplyRemote, TABLES, toLocal, toRemote } from './mapping'
import type { RemoteRow } from './mapping'

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'signedOut' | 'disabled'

export type SyncState = {
  status: SyncStatus
  pending: number
  lastSyncAt: number | null
  lastError: string | null
}

/** What the engine needs from the server. The real one wraps supabase-js; tests use a fake. */
export interface Remote {
  userId(): Promise<string | null>
  refresh(): Promise<boolean>
  upsert(table: string, rows: RemoteRow[], onConflict: string): Promise<void>
  /** Rows with server_updated_at >= cursor, ascending, one page. */
  pull(table: string, cursor: string | null, offset: number, limit: number): Promise<RemoteRow[]>
}

/** Errors the remote throws, classified. */
export class SyncError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'auth' | 'other',
  ) {
    super(message)
  }
}

const PUSH_BATCH = 200
const PULL_PAGE = 1000
const DEBOUNCE_MS = 2000
const BACKOFF_MS = [5_000, 30_000, 120_000]

type AnyTable = Table<Record<string, unknown> & { updatedAt: number; dirty: 0 | 1; deleted: 0 | 1 }, string>
const table = (name: SyncTableName) => db.table(name) as unknown as AnyTable

// ---- state ----
let state: SyncState = { status: 'disabled', pending: 0, lastSyncAt: null, lastError: null }
const subs = new Set<() => void>()
function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch }
  for (const s of subs) s()
}
export const getSyncState = () => state
export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => state,
  )
}

export async function countPending(): Promise<number> {
  const n = await Promise.all(SYNC_TABLES.map((t) => table(t).where('dirty').equals(1).count()))
  return n.reduce((a, b) => a + b, 0)
}

const cursorKey = (t: SyncTableName) => `cursor:${t}`
async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined
}
const setMeta = (key: string, value: unknown) => db.meta.put({ key, value })

// ---- one pass ----

/** Pull first, so a stale local row never overwrites newer data on the server; then push. */
export async function syncOnce(remote: Remote): Promise<void> {
  const userId = await remote.userId()
  if (!userId) throw new SyncError('Sin sesión', 'auth')
  for (const t of SYNC_TABLES) await pullTable(remote, t)
  for (const t of SYNC_TABLES) await pushTable(remote, t, userId)
}

export async function pullTable(remote: Remote, t: SyncTableName): Promise<number> {
  const map = TABLES[t]
  const cursor = (await getMeta<string>(cursorKey(t))) ?? null
  let max = cursor
  let applied = 0
  for (let offset = 0; ; offset += PULL_PAGE) {
    const rows = await remote.pull(map.remote, cursor, offset, PULL_PAGE)
    if (rows.length) {
      await db.transaction('rw', table(t), async () => {
        for (const r of rows) {
          const local = toLocal(t, r)
          const key = local[map.key] as string
          const cur = await table(t).get(key)
          if (shouldApplyRemote(cur, local.updatedAt)) {
            await table(t).put(local)
            applied++
          }
        }
      })
      for (const r of rows) if (r.server_updated_at && (!max || r.server_updated_at > max)) max = r.server_updated_at
    }
    if (rows.length < PULL_PAGE) break
  }
  if (max && max !== cursor) await setMeta(cursorKey(t), max)
  return applied
}

export async function pushTable(remote: Remote, t: SyncTableName, userId: string): Promise<number> {
  const map = TABLES[t]
  const dirty = await table(t).where('dirty').equals(1).toArray()
  let pushed = 0
  for (let i = 0; i < dirty.length; i += PUSH_BATCH) {
    const batch = dirty.slice(i, i + PUSH_BATCH)
    await remote.upsert(map.remote, batch.map((r) => toRemote(t, r, userId)), map.onConflict)
    // Clear dirty only if the row didn't change while it was uploading.
    await db.transaction('rw', table(t), async () => {
      for (const r of batch) {
        const key = r[map.key] as string
        const cur = await table(t).get(key)
        if (cur && cur.updatedAt === r.updatedAt) {
          await table(t).update(key, { dirty: 0 })
          pushed++
        }
      }
    })
  }
  return pushed
}

// ---- runner: mutex, triggers, errors, backoff ----

let remoteImpl: Remote | null = null
let running: Promise<void> | null = null
let again = false
let debounce: number | undefined
let retry: number | undefined
let failures = 0

export async function syncNow(): Promise<void> {
  if (!remoteImpl) return
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    do {
      again = false
      await runPass(remoteImpl!)
    } while (again)
  })()
  try {
    await running
  } finally {
    running = null
  }
}

async function runPass(remote: Remote) {
  window.clearTimeout(retry)
  if (!navigator.onLine) {
    set({ status: 'offline', pending: await countPending() })
    return
  }
  set({ status: 'syncing' })
  try {
    try {
      await syncOnce(remote)
    } catch (e) {
      // Expired token: refresh once and retry.
      if (e instanceof SyncError && e.kind === 'auth' && (await remote.refresh())) await syncOnce(remote)
      else throw e
    }
    failures = 0
    const now = Date.now()
    await setMeta('lastSyncAt', now)
    set({ status: 'idle', lastSyncAt: now, lastError: null, pending: await countPending() })
  } catch (e) {
    const pending = await countPending()
    if (e instanceof SyncError && e.kind === 'network') {
      set({ status: 'offline', pending })
    } else if (e instanceof SyncError && e.kind === 'auth') {
      set({ status: 'signedOut', pending, lastError: 'Inicia sesión para sincronizar' })
    } else {
      const msg = e instanceof Error ? e.message : String(e)
      await setMeta('lastError', msg)
      set({ status: 'error', pending, lastError: msg })
      const wait = BACKOFF_MS[Math.min(failures, BACKOFF_MS.length - 1)]!
      failures++
      retry = window.setTimeout(() => void syncNow(), wait)
    }
  }
}

/** Wire the triggers (SPEC §5.4). Call once at startup. */
export async function startSync(remote: Remote | null): Promise<void> {
  const lastSyncAt = (await getMeta<number>('lastSyncAt')) ?? null
  const lastError = (await getMeta<string>('lastError')) ?? null
  if (!remote) {
    set({ status: 'disabled', pending: await countPending(), lastSyncAt })
    return
  }
  remoteImpl = remote
  set({ lastSyncAt, lastError, pending: await countPending() })

  window.addEventListener('online', () => void syncNow())
  window.addEventListener('offline', () => set({ status: 'offline' }))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })
  onLocalWrite(() => {
    void countPending().then((pending) => set({ pending }))
    window.clearTimeout(debounce)
    if (navigator.onLine) debounce = window.setTimeout(() => void syncNow(), DEBOUNCE_MS)
  })

  if (await remote.userId()) void syncNow()
  else set({ status: 'signedOut' })
}

/** After signing in: the first sync uploads everything local. */
export const afterSignIn = () => syncNow()
export const afterSignOut = async () => set({ status: 'signedOut', pending: await countPending() })
