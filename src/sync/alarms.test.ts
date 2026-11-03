import { describe, expect, it } from 'vitest'
import { alarms, clearAlarm, onAlarmChange, setAlarm } from './alarms'

describe('alarm registry', () => {
  it('notifies on new times and clears, but not on the same time again', () => {
    const events: string[] = []
    const off = onAlarmChange((tag, a) => events.push(a ? `set:${tag}:${a.at}` : `clear:${tag}`))
    setAlarm('cardio', 100_000, 'Cardio terminado', 'x')
    setAlarm('cardio', 100_400, 'Cardio terminado', 'x') // same second-ish: ignored
    setAlarm('cardio', 130_000, 'Cardio terminado', 'x') // paused/resumed: new end
    clearAlarm('cardio')
    clearAlarm('cardio') // already gone: ignored
    off()
    expect(events).toEqual(['set:cardio:100000', 'set:cardio:130000', 'clear:cardio'])
    expect(alarms.size).toBe(0)
  })
})
