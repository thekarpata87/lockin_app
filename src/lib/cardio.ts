// CASA rules (CONTENT §9): C at most twice a week and never on consecutive days.
import { CARDIO_RULES } from '../data/cardio'
import type { CardioLog } from '../db/schema'
import { addDays, weekStartOf } from './dates'

export function cRuleWarning(logs: Pick<CardioLog, 'date' | 'kind' | 'deleted'>[], date: string): string | null {
  const cs = logs.filter((l) => l.kind === 'C' && !l.deleted)
  const ws = weekStartOf(date)
  const thisWeek = new Set(cs.filter((l) => weekStartOf(l.date) === ws && l.date !== date).map((l) => l.date))
  if (cs.some((l) => l.date === addDays(date, -1))) return 'Ayer hiciste C. Evita intervalos dos días seguidos; mejor A o B.'
  if (thisWeek.size >= CARDIO_RULES.maxCPerWeek) return `Ya hiciste C ${thisWeek.size} veces esta semana. El máximo es ${CARDIO_RULES.maxCPerWeek}.`
  return null
}
