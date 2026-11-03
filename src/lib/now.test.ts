import { describe, expect, it } from 'vitest'
import { nowItem, rampStep, scheduleFor } from './now'

const S = { wakeTime: '05:15', sleepTime: '22:00', sleepRamp: false, sleepRampStart: null }

describe('scheduleFor', () => {
  it('weekday has gym with the day title and home cardio session', () => {
    const items = scheduleFor('lun', '2026-11-02', S)
    expect(items.find((i) => i.id === 'gym')).toMatchObject({ start: '06:00', end: '07:15', detail: 'PECHO' })
    expect(items.find((i) => i.id === 'homeCardio')?.cardioKind).toBe('A')
    expect(items.find((i) => i.id === 'pre')?.start).toBe('05:20')
  })

  it('saturday: no gym or work, long cardio in the morning', () => {
    const items = scheduleFor('sab', '2026-11-07', S)
    expect(items.some((i) => i.id === 'gym' || i.id === 'trabajo' || i.id === 'gymCardio')).toBe(false)
    expect(items.find((i) => i.id === 'homeCardio')).toMatchObject({ start: '06:00', cardioKind: 'largo' })
  })

  it('sunday: rest, no cardio', () => {
    const items = scheduleFor('dom', '2026-11-08', S)
    expect(items.some((i) => i.kind === 'gym' || i.kind === 'cardio')).toBe(false)
    expect(items.some((i) => i.id === 'walk')).toBe(true)
  })

  it('sleep ramp shifts wake, gym and sleep', () => {
    const ramp = { ...S, sleepRamp: true, sleepRampStart: '2026-11-02' }
    const n1 = scheduleFor('lun', '2026-11-02', ramp)
    expect(n1.find((i) => i.id === 'wake')?.start).toBe('06:00')
    expect(n1.find((i) => i.id === 'gym')).toMatchObject({ start: '06:30', end: '07:45' })
    expect(n1.find((i) => i.id === 'gymCardio')).toMatchObject({ start: '07:45', end: '07:55' })
    expect(n1.find((i) => i.id === 'sleep')?.start).toBe('23:30')
    expect(rampStep(ramp, '2026-11-05')?.sleep).toBe('23:00')
    expect(rampStep(ramp, '2026-11-08')).toBeNull()
  })
})

describe('nowItem', () => {
  const items = scheduleFor('mar', '2026-11-03', S)
  const at = (t: string) => nowItem(items, t)?.id

  it('before waking shows wake; after bedtime shows sleep', () => {
    expect(at('03:00')).toBe('wake')
    expect(at('23:10')).toBe('sleep')
  })

  it('inside a window shows it', () => {
    expect(at('06:30')).toBe('gym')
    expect(at('07:20')).toBe('gymCardio')
  })

  it('point items stay current for 45 min, then the next shows', () => {
    expect(at('13:40')).toBe('comida')
    expect(at('14:20')).toBe('homeCardio')
    expect(at('11:10')).toBe('colacion')
    expect(at('09:30')).toBe('colacion')
  })
})
