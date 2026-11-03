import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './schema'
import { getBodyMetric, listBodyMetrics, saveBodyMetric, deleteBodyMetric } from './repo/bodyMetrics'
import { addWater, getDailyLog, setHabit, setMealFilled, setMealRecipe } from './repo/dailyLogs'
import { ensureStartDate, getSettings, updateSettings } from './repo/settings'
import { toggleShoppingItem } from './repo/weeklyPlans'
import { endSession, lastSetsForExercise, saveSet, setsForSession, startSession } from './repo/workouts'
import { onLocalWrite } from './write'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('writes mark dirty and bump updatedAt', () => {
  it('daily log: create on first write, then patch', async () => {
    expect(await getDailyLog('2026-11-03')).toBeUndefined()
    const a = await setMealFilled('2026-11-03', 'desayuno', { P: 3 })
    expect(a).toMatchObject({ dirty: 1, deleted: 0, waterMl: 0, meals: { desayuno: { filled: { P: 3 } } } })
    await db.dailyLogs.update('2026-11-03', { dirty: 0 }) // as if synced
    const b = await addWater('2026-11-03', 250)
    expect(b.dirty).toBe(1)
    expect(b.updatedAt).toBeGreaterThan(a.updatedAt)
    expect(b.meals.desayuno?.filled).toEqual({ P: 3 })
    const c = await setMealRecipe('2026-11-03', 'desayuno', 'des-bowl-yogurt')
    expect(c.meals.desayuno).toEqual({ filled: { P: 3 }, recipeId: 'des-bowl-yogurt' })
    const d = await setHabit('2026-11-03', 'gym', true)
    expect(d.habits.gym).toBe(true)
  })

  it('updatedAt strictly increases even within the same millisecond', async () => {
    const stamps: number[] = []
    for (let i = 0; i < 5; i++) stamps.push((await addWater('2026-11-03', 250)).updatedAt)
    expect(new Set(stamps).size).toBe(5)
    expect([...stamps].sort((x, y) => x - y)).toEqual(stamps)
  })

  it('notifies listeners on every write', async () => {
    let n = 0
    const off = onLocalWrite(() => n++)
    await addWater('2026-11-03', 250)
    await saveBodyMetric('2026-11-03', { weightKg: 99.4 })
    off()
    await addWater('2026-11-03', 250)
    expect(n).toBe(2)
  })
})

describe('settings', () => {
  it('defaults, patch and start date', async () => {
    expect((await getSettings()).restSec).toBe(75)
    await updateSettings({ restSec: 90 })
    expect(await ensureStartDate('2026-11-03')).toBe('2026-11-03')
    expect(await ensureStartDate('2026-11-10')).toBe('2026-11-03')
    const s = await getSettings()
    expect([s.restSec, s.startDate, s.goalKg]).toEqual([90, '2026-11-03', 85])
  })
})

describe('body metrics', () => {
  it('saves, lists in range and soft-deletes', async () => {
    await saveBodyMetric('2026-11-01', { weightKg: 100 })
    await saveBodyMetric('2026-11-03', { weightKg: 99.2 })
    await saveBodyMetric('2026-11-03', { waistCm: 104 })
    expect(await getBodyMetric('2026-11-03')).toMatchObject({ weightKg: 99.2, waistCm: 104 })
    await deleteBodyMetric('2026-11-01')
    const rows = await listBodyMetrics('2026-10-01', '2026-11-30')
    expect(rows.map((r) => r.date)).toEqual(['2026-11-03'])
    expect((await db.bodyMetrics.get('2026-11-01'))).toMatchObject({ deleted: 1, dirty: 1 })
  })
})

describe('workouts', () => {
  it('última vez returns the previous session sets in order', async () => {
    const s1 = await startSession('2026-11-02', 'lun')
    await saveSet({ sessionId: s1.id, exerciseId: 'press-banca', setIndex: 1, weightKg: 60, reps: 12, done: true })
    await saveSet({ sessionId: s1.id, exerciseId: 'press-banca', setIndex: 0, weightKg: 60, reps: 12, done: true })
    await endSession(s1.id, 20)

    const s2 = await startSession('2026-11-09', 'lun')
    await saveSet({ sessionId: s2.id, exerciseId: 'press-banca', setIndex: 0, weightKg: 62.5, reps: 10, done: true })

    const last = await lastSetsForExercise('press-banca', s2.id)
    expect(last.map((s) => [s.setIndex, s.weightKg])).toEqual([[0, 60], [1, 60]])
    expect((await setsForSession(s2.id)).length).toBe(1)
    expect(await lastSetsForExercise('sentadilla')).toEqual([])
  })
})

describe('weekly plans', () => {
  it('toggles shopping items', async () => {
    await toggleShoppingItem('2026-11-02', 'pollo')
    const p = await toggleShoppingItem('2026-11-02', 'arroz')
    expect(p.shoppingChecked).toEqual(['pollo', 'arroz'])
    expect((await toggleShoppingItem('2026-11-02', 'pollo')).shoppingChecked).toEqual(['arroz'])
  })
})
