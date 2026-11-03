import { describe, expect, it } from 'vitest'
import { addDays, dayKeyOf, daysBetween, planDay, toISODate, weekStartOf } from './dates'

describe('dates', () => {
  it('formats local dates', () => {
    expect(toISODate(new Date(2026, 10, 3))).toBe('2026-11-03')
  })

  it('day keys', () => {
    expect(dayKeyOf('2026-11-03')).toBe('mar')
    expect(dayKeyOf('2026-11-08')).toBe('dom')
  })

  it('week starts on Monday', () => {
    expect(weekStartOf('2026-11-03')).toBe('2026-11-02')
    expect(weekStartOf('2026-11-02')).toBe('2026-11-02')
    expect(weekStartOf('2026-11-08')).toBe('2026-11-02')
    expect(weekStartOf('2026-11-09')).toBe('2026-11-09')
  })

  it('adds days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('counts days and plan day', () => {
    expect(daysBetween('2026-11-01', '2026-11-03')).toBe(2)
    expect(planDay('2026-11-03', '2026-11-03')).toBe(1)
    expect(planDay('2026-10-23', '2026-11-03')).toBe(12)
  })
})
