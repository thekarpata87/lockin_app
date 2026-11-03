// CONTENT §1. Daily schedule.
import type { MealKey } from './types'

export type ScheduleKind = 'habito' | 'comida' | 'gym' | 'cardio' | 'trabajo'

export type ScheduleItem = {
  id: string
  /** HH:mm */
  start: string
  end?: string
  label: string
  kind: ScheduleKind
  meal?: MealKey
  cardio?: 'post' | 'home'
}

/** Monday to Friday. */
export const WEEKDAY_SCHEDULE: readonly ScheduleItem[] = [
  { id: 'wake', start: '05:15', label: 'Despertar, 500 ml de agua', kind: 'habito' },
  { id: 'pre', start: '05:20', label: 'Pre-entreno o café + creatina + 1 fruta', kind: 'comida', meal: 'pre' },
  { id: 'gym', start: '06:00', end: '07:15', label: 'Pesas (rutina del día)', kind: 'gym' },
  { id: 'gymCardio', start: '07:15', end: '07:40', label: 'Cardio post-gym', kind: 'cardio', cardio: 'post' },
  { id: 'desayuno', start: '08:00', label: 'Desayuno (licuado de proteína post-gym)', kind: 'comida', meal: 'desayuno' },
  { id: 'trabajo', start: '09:00', end: '13:00', label: 'Trabajo', kind: 'trabajo' },
  { id: 'colacion', start: '11:00', label: 'Colación', kind: 'comida', meal: 'colacion' },
  { id: 'comida', start: '13:30', label: 'Comida', kind: 'comida', meal: 'comida' },
  { id: 'homeCardio', start: '18:00', end: '18:40', label: 'Cardio en casa', kind: 'cardio', cardio: 'home' },
  { id: 'cena', start: '19:30', label: 'Cena', kind: 'comida', meal: 'cena' },
  { id: 'screensOff', start: '21:30', label: 'Pantallas fuera, luz baja', kind: 'habito' },
  { id: 'sleep', start: '22:00', label: 'Dormir', kind: 'habito' },
]

export const MEAL_TIMES: Record<MealKey, string> = {
  pre: '05:20',
  desayuno: '08:00',
  colacion: '11:00',
  comida: '13:30',
  cena: '19:30',
}

export const WEEKEND_NOTES = {
  sab: 'Sin gym. Cardio Largo (o B) por la mañana y el resto igual.',
  dom: 'Descanso activo (caminata ligera). Día de preparación de comidas y día sugerido para la comida flexible.',
} as const

/** "Ajustar sueño gradualmente" (CONTENT §1.2). fromNight is 1-based; last step applies from night 7 on. */
export type SleepRampStep = {
  fromNight: number
  sleep: string
  wake: string
  gym: { start: string; end: string }
  note?: string
}

export const SLEEP_RAMP: readonly SleepRampStep[] = [
  { fromNight: 1, sleep: '23:30', wake: '06:00', gym: { start: '06:30', end: '07:45' }, note: 'Cardio post-gym de 10 min' },
  { fromNight: 3, sleep: '23:00', wake: '05:45', gym: { start: '06:15', end: '07:35' } },
  { fromNight: 5, sleep: '22:30', wake: '05:30', gym: { start: '06:00', end: '07:25' } },
  { fromNight: 7, sleep: '22:00', wake: '05:15', gym: { start: '06:00', end: '07:15' } },
]

export const MIN_SLEEP_HOURS = 7
