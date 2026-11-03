import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveBodyMetric } from './repo/bodyMetrics'
import { addWater } from './repo/dailyLogs'
import { getSettings, updateSettings } from './repo/settings'
import { saveWeekPlan, emptyWeekPlan } from './repo/weeklyPlans'
import { saveSet, startSession } from './repo/workouts'
import { officialStartReset } from './reset'
import { db } from './schema'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

async function seed() {
  await updateSettings({ startDate: '2026-11-03', restSec: 90 })
  await saveBodyMetric('2026-11-03', { weightKg: 99 })
  await addWater('2026-11-03', 500)
  const s = await startSession('2026-11-03', 'mar')
  await saveSet({ sessionId: s.id, exerciseId: 'jalon-abierto', setIndex: 0, weightKg: 40, reps: 10, done: true })
  await saveWeekPlan('2026-11-02', emptyWeekPlan())
}

describe('officialStartReset', () => {
  it('the day before: wipes everything and starts the plan on Nov 4, once', async () => {
    await seed()
    expect(await officialStartReset('2026-11-03')).toBe('wiped')
    expect(await db.bodyMetrics.count()).toBe(0)
    expect(await db.dailyLogs.count()).toBe(0)
    expect(await db.setLogs.count()).toBe(0)
    expect(await db.weeklyPlans.count()).toBe(0)
    const s = await getSettings()
    expect([s.startDate, s.restSec]).toEqual(['2026-11-04', 75])
    // a second run does nothing
    await saveBodyMetric('2026-11-03', { weightKg: 98 })
    expect(await officialStartReset('2026-11-03')).toBe('already')
    expect(await db.bodyMetrics.count()).toBe(1)
  })

  it('on Nov 4: keeps what was logged that day', async () => {
    await seed()
    await saveBodyMetric('2026-11-04', { weightKg: 98.6 })
    const s = await startSession('2026-11-04', 'mie')
    await saveSet({ sessionId: s.id, exerciseId: 'press-militar', setIndex: 0, weightKg: 30, reps: 10, done: true })
    expect(await officialStartReset('2026-11-04')).toBe('trimmed')
    expect((await db.bodyMetrics.toArray()).map((m) => m.date)).toEqual(['2026-11-04'])
    expect(await db.setLogs.count()).toBe(1)
    expect(await db.workoutSessions.count()).toBe(1)
    expect((await getSettings()).startDate).toBe('2026-11-04')
  })

  it('after Nov 4: never touches anything', async () => {
    await seed()
    expect(await officialStartReset('2026-11-05')).toBe('skipped')
    expect(await db.bodyMetrics.count()).toBe(1)
  })
})
