// CONTENT §9. Low impact, no jumps. Base intensity: zone 2.
import type { DayKey } from './types'

export type CardioKind = 'post' | 'A' | 'B' | 'C' | 'largo'

/** Declarative structure; lib/timer.ts expands it into timed phases (M5). */
export type CardioSegment =
  | { kind: 'warmup' | 'cooldown' | 'steady'; sec: number; label: string }
  | { kind: 'circuit'; rounds: number; workSec: number; restSec: number; exercises: string[] }
  | { kind: 'intervals'; rounds: number; workSec: number; restSec: number; workLabel: string; restLabel: string }

export type CardioSession = {
  id: CardioKind
  name: string
  description: string
  minutes: { min: number; max: number }
  segments: CardioSegment[]
}

export type CircuitExercise = { id: string; name: string; cue: string }

export const CIRCUIT_B: readonly CircuitExercise[] = [
  { id: 'b-sentadilla-silla', name: 'Sentadilla a silla', cue: 'Tocar la silla con los glúteos y subir, sin sentarse' },
  { id: 'b-escalon', name: 'Subir escalón', cue: 'Alternar piernas; usar un escalón firme' },
  { id: 'b-rodillas', name: 'Marcha con rodillas altas', cue: 'Sin saltar, braceo activo' },
  { id: 'b-boxeo', name: 'Boxeo de sombra', cue: 'Golpes rápidos, pies en movimiento' },
  { id: 'b-climbers', name: 'Mountain climbers inclinados', cue: 'Manos en el sillón, ritmo controlado' },
  { id: 'b-plancha', name: 'Plancha', cue: 'Con rodillas apoyadas si hace falta' },
]

export const CARDIO_SESSIONS: readonly CardioSession[] = [
  {
    id: 'post', name: 'Post-gym',
    description: 'Caminadora inclinada al 8–12% a 5–5.5 km/h, o escaladora, en zona 2',
    minutes: { min: 20, max: 25 },
    segments: [{ kind: 'steady', sec: 20 * 60, label: 'Zona 2' }],
  },
  {
    id: 'A', name: 'Continua',
    description: 'Caminata rápida, bici estática o elíptica en zona 2',
    minutes: { min: 40, max: 40 },
    segments: [{ kind: 'steady', sec: 40 * 60, label: 'Zona 2' }],
  },
  {
    id: 'B', name: 'Circuito sin saltos',
    description: '5 min de calentamiento, 5 rondas de 6 ejercicios (40 s de trabajo / 20 s de descanso) sin pausa entre rondas y 5 min de enfriamiento',
    minutes: { min: 40, max: 40 },
    segments: [
      { kind: 'warmup', sec: 5 * 60, label: 'Calentamiento' },
      { kind: 'circuit', rounds: 5, workSec: 40, restSec: 20, exercises: CIRCUIT_B.map((e) => e.id) },
      { kind: 'cooldown', sec: 5 * 60, label: 'Enfriamiento' },
    ],
  },
  {
    id: 'C', name: 'Intervalos',
    description: '5 min suave, 8 × (30 s fuerte / 90 s suave), 5 min suave y 14 min de zona 2',
    minutes: { min: 40, max: 40 },
    segments: [
      { kind: 'warmup', sec: 5 * 60, label: 'Suave' },
      { kind: 'intervals', rounds: 8, workSec: 30, restSec: 90, workLabel: 'Fuerte', restLabel: 'Suave' },
      { kind: 'cooldown', sec: 5 * 60, label: 'Suave' },
      { kind: 'steady', sec: 14 * 60, label: 'Zona 2' },
    ],
  },
  {
    id: 'largo', name: 'Largo del sábado',
    description: 'Caminata o bici en zona 2',
    minutes: { min: 45, max: 60 },
    segments: [{ kind: 'steady', sec: 45 * 60, label: 'Zona 2' }],
  },
]

export const CARDIO_BY_ID: ReadonlyMap<CardioKind, CardioSession> = new Map(CARDIO_SESSIONS.map((s) => [s.id, s]))

/** Suggested home cardio week. null = rest (light walk). */
export const HOME_CARDIO_WEEK: Record<DayKey, { main: CardioKind | null; alt?: CardioKind }> = {
  lun: { main: 'A' },
  mar: { main: 'B' },
  mie: { main: 'A' },
  jue: { main: 'C' },
  vie: { main: 'A' },
  sab: { main: 'largo', alt: 'B' },
  dom: { main: null },
}

export const CARDIO_RULES = {
  zone2: 'Zona 2: poder hablar con frases completas, pero no cantar.',
  maxCPerWeek: 2,
  noConsecutiveC: true,
  knees: 'Si duelen las rodillas o hay fatiga acumulada, cambia B o C por A.',
  restDay: 'Descanso (caminata ligera)',
} as const

export const STEPS_GOAL = { min: 8000, max: 10000 } as const
