import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveBodyMetric } from '../db/repo/bodyMetrics'
import { addWater } from '../db/repo/dailyLogs'
import { db } from '../db/schema'
import { BackupError, backupFileName, exportBackup, importBackup, needsBackupReminder, parseBackup } from './backup'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('backup', () => {
  it('exports every table and restores into an empty phone', async () => {
    await saveBodyMetric('2026-11-04', { weightKg: 99.1 })
    await addWater('2026-11-04', 750)
    const b = await exportBackup(new Date('2026-11-04T20:00:00Z'))
    expect(b.tables.bodyMetrics).toHaveLength(1)
    expect('dirty' in b.tables.bodyMetrics[0]!).toBe(false)

    const text = JSON.stringify(b)
    await db.delete()
    await db.open()
    expect(await importBackup(parseBackup(text))).toEqual({ added: 2, updated: 0, kept: 0 })
    expect(await db.bodyMetrics.get('2026-11-04')).toMatchObject({ weightKg: 99.1, dirty: 1 })
    expect((await db.dailyLogs.get('2026-11-04'))?.waterMl).toBe(750)
  })

  it('merge: newer local rows are kept, older ones are replaced', async () => {
    await db.bodyMetrics.bulkPut([
      { date: '2026-11-04', weightKg: 98, updatedAt: 500, deleted: 0, dirty: 0 },
      { date: '2026-11-05', weightKg: 97, updatedAt: 100, deleted: 0, dirty: 0 },
    ])
    const b = parseBackup(
      JSON.stringify({
        app: 'bloque',
        version: 1,
        exportedAt: '',
        tables: { bodyMetrics: [{ date: '2026-11-04', weightKg: 99, updatedAt: 200, deleted: 0 }, { date: '2026-11-05', weightKg: 96.5, updatedAt: 300, deleted: 0 }] },
      }),
    )
    expect(await importBackup(b)).toEqual({ added: 0, updated: 1, kept: 1 })
    expect((await db.bodyMetrics.get('2026-11-04'))?.weightKg).toBe(98)
    expect((await db.bodyMetrics.get('2026-11-05'))?.weightKg).toBe(96.5)
  })

  it('rejects files that are not BLOQUE backups', () => {
    expect(() => parseBackup('no json')).toThrow(BackupError)
    expect(() => parseBackup('{"app":"otra"}')).toThrow('no es un respaldo de BLOQUE')
    expect(() => parseBackup('{"app":"bloque","version":9,"tables":{}}')).toThrow('más nueva')
    expect(() => parseBackup('{"app":"bloque","version":1,"tables":{"setLogs":{}}}')).toThrow('formato inesperado')
  })

  it('file name and 30-day reminder', () => {
    expect(backupFileName(new Date(2026, 10, 4))).toBe('bloque-respaldo-2026-11-04.json')
    const day = 86_400_000
    const now = 100 * day
    expect(needsBackupReminder(now - 10 * day, null, now)).toBe(false)
    expect(needsBackupReminder(now - 31 * day, null, now)).toBe(true)
    expect(needsBackupReminder(now - 31 * day, now - 2 * day, now)).toBe(false)
    expect(needsBackupReminder(null, null, now)).toBe(true)
    // counted from the plan start: a recent start doesn't nag
    expect(needsBackupReminder(null, null, now, now - 5 * day)).toBe(false)
    expect(needsBackupReminder(null, null, now, now - 40 * day)).toBe(true)
  })
})
