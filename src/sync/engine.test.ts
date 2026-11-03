import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveBodyMetric } from '../db/repo/bodyMetrics'
import { addWater } from '../db/repo/dailyLogs'
import { getSettings } from '../db/repo/settings'
import { db } from '../db/schema'
import { countPending, pullTable, pushTable, syncOnce } from './engine'
import type { Remote } from './engine'
import { shouldApplyRemote, toLocal, toRemote } from './mapping'
import type { RemoteRow } from './mapping'
import { normalizeSupabaseUrl } from './supabase'

/** In-memory Supabase: upsert by conflict target, server_updated_at stamped on every write. */
class FakeRemote implements Remote {
  tables = new Map<string, Map<string, RemoteRow>>()
  clock = 0
  onUpsert?: () => Promise<void>
  constructor(public user: string | null = 'u1') {}
  async userId() {
    return this.user
  }
  async refresh() {
    return false
  }
  stamp() {
    return new Date(Date.UTC(2026, 10, 3, 0, 0, this.clock++)).toISOString()
  }
  write(table: string, row: RemoteRow, onConflict: string) {
    const t = this.tables.get(table) ?? new Map()
    const key = onConflict.split(',').map((c) => String(row[c])).join('|')
    t.set(key, { ...t.get(key), ...row, server_updated_at: this.stamp() })
    this.tables.set(table, t)
  }
  async upsert(table: string, rows: RemoteRow[], onConflict: string) {
    await this.onUpsert?.()
    for (const r of rows) this.write(table, r, onConflict)
  }
  async pull(table: string, cursor: string | null, offset: number, limit: number) {
    const rows = [...(this.tables.get(table)?.values() ?? [])]
      .filter((r) => !cursor || r.server_updated_at! >= cursor)
      .sort((a, b) => a.server_updated_at!.localeCompare(b.server_updated_at!))
    return rows.slice(offset, offset + limit)
  }
  rows(table: string) {
    return [...(this.tables.get(table)?.values() ?? [])]
  }
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('mapping and conflict rule', () => {
  it('round-trips a row camelCase ↔ snake_case', () => {
    const local = { date: '2026-11-03', weightKg: 98.4, waistCm: undefined, updatedAt: 5, deleted: 0 as const, dirty: 1 as const }
    const remote = toRemote('bodyMetrics', local, 'u1')
    expect(remote).toEqual({ user_id: 'u1', date: '2026-11-03', weight_kg: 98.4, waist_cm: null, note: null, updated_at: 5, deleted: false })
    expect(toLocal('bodyMetrics', { ...remote, weight_kg: '98.40' })).toEqual({ date: '2026-11-03', weightKg: 98.4, updatedAt: 5, deleted: 0, dirty: 0 })
  })

  it('last write wins', () => {
    expect(shouldApplyRemote(undefined, 1)).toBe(true)
    expect(shouldApplyRemote({ updatedAt: 10, dirty: 0 }, 5)).toBe(true) // clean local: take remote
    expect(shouldApplyRemote({ updatedAt: 10, dirty: 1 }, 5)).toBe(false) // dirty and newer: keep
    expect(shouldApplyRemote({ updatedAt: 10, dirty: 1 }, 10)).toBe(false) // tie: keep local
    expect(shouldApplyRemote({ updatedAt: 10, dirty: 1 }, 11)).toBe(true) // remote newer
  })

  it('normalizes the project URL', () => {
    expect(normalizeSupabaseUrl('https://abc.supabase.co/rest/v1/')).toBe('https://abc.supabase.co')
    expect(normalizeSupabaseUrl(' https://abc.supabase.co ')).toBe('https://abc.supabase.co')
    expect(normalizeSupabaseUrl('abc')).toBeNull()
    expect(normalizeSupabaseUrl(undefined)).toBeNull()
  })
})

describe('push', () => {
  it('uploads dirty rows with the user id and marks them clean', async () => {
    const r = new FakeRemote()
    await saveBodyMetric('2026-11-03', { weightKg: 98.4 })
    expect(await pushTable(r, 'bodyMetrics', 'u1')).toBe(1)
    expect(r.rows('body_metrics')[0]).toMatchObject({ user_id: 'u1', date: '2026-11-03', weight_kg: 98.4 })
    expect((await db.bodyMetrics.get('2026-11-03'))?.dirty).toBe(0)
    expect(await countPending()).toBe(0)
  })

  it('a row edited while uploading stays dirty for the next pass', async () => {
    const r = new FakeRemote()
    await addWater('2026-11-03', 250)
    r.onUpsert = async () => {
      r.onUpsert = undefined
      await addWater('2026-11-03', 250)
    }
    await pushTable(r, 'dailyLogs', 'u1')
    expect((await db.dailyLogs.get('2026-11-03'))).toMatchObject({ dirty: 1, waterMl: 500 })
    await pushTable(r, 'dailyLogs', 'u1')
    expect((await db.dailyLogs.get('2026-11-03'))?.dirty).toBe(0)
    expect(r.rows('daily_logs')[0]).toMatchObject({ water_ml: 500 })
  })

  it('soft deletes travel like any change', async () => {
    const r = new FakeRemote()
    await saveBodyMetric('2026-11-03', { weightKg: 98 })
    const { deleteBodyMetric } = await import('../db/repo/bodyMetrics')
    await deleteBodyMetric('2026-11-03')
    await pushTable(r, 'bodyMetrics', 'u1')
    expect(r.rows('body_metrics')[0]?.deleted).toBe(true)
  })
})

describe('pull', () => {
  it('applies remote rows, keeps newer dirty local ones, saves the cursor', async () => {
    const r = new FakeRemote()
    r.write('body_metrics', { user_id: 'u1', date: '2026-11-01', weight_kg: 99, updated_at: 100, deleted: false }, 'user_id,date')
    r.write('body_metrics', { user_id: 'u1', date: '2026-11-02', weight_kg: 98.8, updated_at: 100, deleted: false }, 'user_id,date')
    // local edit of 11-02 made later than the remote one
    await db.bodyMetrics.put({ date: '2026-11-02', weightKg: 98.6, updatedAt: 200, deleted: 0, dirty: 1 })

    expect(await pullTable(r, 'bodyMetrics')).toBe(1)
    expect(await db.bodyMetrics.get('2026-11-01')).toMatchObject({ weightKg: 99, dirty: 0 })
    expect(await db.bodyMetrics.get('2026-11-02')).toMatchObject({ weightKg: 98.6, dirty: 1 })
    const cursor = (await db.meta.get('cursor:bodyMetrics'))?.value
    expect(cursor).toBe(r.rows('body_metrics')[1]!.server_updated_at)

    // a change made in Supabase comes down on the next pull
    r.write('body_metrics', { user_id: 'u1', date: '2026-11-01', weight_kg: 97.5, updated_at: 300, deleted: false }, 'user_id,date')
    await pullTable(r, 'bodyMetrics')
    expect((await db.bodyMetrics.get('2026-11-01'))?.weightKg).toBe(97.5)
  })
})

describe('full sync', () => {
  it('20 records made offline all reach the server', async () => {
    const r = new FakeRemote()
    for (let i = 1; i <= 10; i++) await saveBodyMetric(`2026-11-${String(i).padStart(2, '0')}`, { weightKg: 100 - i / 10 })
    for (let i = 1; i <= 10; i++) await addWater(`2026-11-${String(i).padStart(2, '0')}`, 250)
    expect(await countPending()).toBe(20)
    await syncOnce(r)
    expect(r.rows('body_metrics')).toHaveLength(10)
    expect(r.rows('daily_logs')).toHaveLength(10)
    expect(await countPending()).toBe(0)
  })

  it('a fresh install does not overwrite settings already on the server', async () => {
    const r = new FakeRemote()
    r.write('settings', { user_id: 'u1', data: { startDate: '2026-11-04', restSec: 90 }, updated_at: 1_000, deleted: false }, 'user_id')
    // fresh install: default settings with an old timestamp, still dirty
    const { ensureStartDate } = await import('../db/repo/settings')
    await ensureStartDate('2026-12-01')
    await syncOnce(r)
    const s = await getSettings()
    expect([s.startDate, s.restSec]).toEqual(['2026-11-04', 90])
    expect(r.rows('settings')[0]?.data).toMatchObject({ startDate: '2026-11-04', restSec: 90 })
  })

  it('without a session it refuses to sync', async () => {
    await expect(syncOnce(new FakeRemote(null))).rejects.toThrow('Sin sesión')
  })
})
