// JSON backup (SPEC §4.6): export everything, import merging by "last write wins".
import { db, SYNC_TABLES } from '../db/schema'
import type { SyncTableName } from '../db/schema'

export const BACKUP_APP = 'bloque'
export const BACKUP_VERSION = 1

export type Backup = {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  tables: Record<SyncTableName, Record<string, unknown>[]>
}

type Row = Record<string, unknown> & { updatedAt: number; deleted: 0 | 1; dirty: 0 | 1 }

export async function exportBackup(now = new Date()): Promise<Backup> {
  const tables = {} as Backup['tables']
  for (const t of SYNC_TABLES) {
    tables[t] = ((await db.table(t).toArray()) as Row[]).map(({ dirty: _dirty, ...rest }) => rest)
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), tables }
}

export const backupFileName = (now = new Date()) =>
  `lockin-respaldo-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`

export class BackupError extends Error {}

/** Validates the file shape; throws BackupError with a message for the person. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('El archivo no es un JSON válido.')
  }
  const b = data as Partial<Backup>
  if (!b || b.app !== BACKUP_APP || typeof b.tables !== 'object' || b.tables === null) {
    throw new BackupError('Este archivo no es un respaldo de LOCK_IN.')
  }
  if ((b.version ?? 0) > BACKUP_VERSION) throw new BackupError('El respaldo es de una versión más nueva de la app. Actualiza primero.')
  for (const t of SYNC_TABLES) {
    const rows = (b.tables as Record<string, unknown>)[t]
    if (rows !== undefined && !Array.isArray(rows)) throw new BackupError(`El respaldo tiene un formato inesperado en ${t}.`)
  }
  return b as Backup
}

export type ImportResult = { added: number; updated: number; kept: number }

/**
 * Merge: a backup row replaces the local one only if it is newer (or there is none).
 * Imported rows are marked dirty so they upload on the next sync.
 */
export async function importBackup(b: Backup): Promise<ImportResult> {
  const res: ImportResult = { added: 0, updated: 0, kept: 0 }
  await db.transaction('rw', SYNC_TABLES.map((t) => db.table(t)), async () => {
    for (const t of SYNC_TABLES) {
      const tbl = db.table(t)
      const key = tbl.schema.primKey.keyPath as string
      for (const raw of b.tables[t] ?? []) {
        const row = raw as Row
        const k = row[key] as string | undefined
        if (k === undefined || typeof row.updatedAt !== 'number') continue
        const cur = (await tbl.get(k)) as Row | undefined
        if (cur && cur.updatedAt >= row.updatedAt) {
          res.kept++
          continue
        }
        await tbl.put({ ...row, deleted: row.deleted ? 1 : 0, dirty: 1 })
        if (cur) res.updated++
        else res.added++
      }
    }
  })
  return res
}

/**
 * "Recuerda exportar un respaldo" when more than 30 days passed without syncing or backing up,
 * counted from the plan start at the earliest (a fresh install doesn't nag).
 */
export function needsBackupReminder(lastSyncAt: number | null, lastBackupAt: number | null, now = Date.now(), sinceMs = 0): boolean {
  const last = Math.max(lastSyncAt ?? 0, lastBackupAt ?? 0, sinceMs)
  return now - last > 30 * 86_400_000
}
