import { describe, expect, it } from 'vitest'
import { cRuleWarning } from './cardio'

const c = (date: string, kind: 'A' | 'C' = 'C') => ({ date, kind, deleted: 0 as const })

describe('cRuleWarning', () => {
  it('warns after C yesterday', () => {
    expect(cRuleWarning([c('2026-11-04')], '2026-11-05')).toMatch(/Ayer/)
  })
  it('warns after 2 C this week', () => {
    expect(cRuleWarning([c('2026-11-02'), c('2026-11-04')], '2026-11-06')).toMatch(/2 veces/)
  })
  it('previous week does not count; A never counts', () => {
    expect(cRuleWarning([c('2026-10-28'), c('2026-10-30'), c('2026-11-03', 'A')], '2026-11-05')).toBeNull()
  })
})
