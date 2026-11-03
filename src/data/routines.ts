// CONTENT §8. Gym routine, Monday to Friday.
export type Equipment = 'barra' | 'mancuerna' | 'maquina' | 'polea' | 'corporal'

/** reps: a range (8–12), a fixed count (15), to failure, or the 21s scheme (7+7+7). */
export type RepScheme =
  | { kind: 'range'; min: number; max: number }
  | { kind: 'fixed'; reps: number }
  | { kind: 'failure' }
  | { kind: '21s' }

export type Exercise = {
  id: string
  name: string
  sets: number
  reps: RepScheme
  equipment: Equipment
  /** Logged per side (izq/der). Reps are per arm/leg. */
  unilateral: boolean
}

export type GymDayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie'

export type GymDay = { key: GymDayKey; dayName: string; title: string; exercises: Exercise[] }

const R = (min = 8, max = 12): RepScheme => ({ kind: 'range', min, max })
const F = (reps: number): RepScheme => ({ kind: 'fixed', reps })
const ex = (id: string, name: string, sets: number, reps: RepScheme, equipment: Equipment, unilateral = false): Exercise => ({
  id, name, sets, reps, equipment, unilateral,
})

export const GYM_DAYS: readonly GymDay[] = [
  {
    key: 'lun', dayName: 'Lunes', title: 'PECHO',
    exercises: [
      ex('press-banca', 'Press de pecho con barra', 5, R(), 'barra'),
      ex('press-mancuerna-neutral', 'Press de pecho neutral cerrado con mancuernas', 5, R(), 'mancuerna'),
      ex('press-inclinado-barra', 'Press de pecho inclinado con barra', 5, R(), 'barra'),
      ex('press-inclinado-mancuerna', 'Press inclinado con mancuernas', 5, R(), 'mancuerna'),
      ex('flys-poleas', 'Flys de pecho en poleas', 5, R(), 'polea'),
      ex('pec-dec', 'Pec-dec', 5, R(), 'maquina'),
      ex('push-ups', 'Lagartijas', 4, { kind: 'failure' }, 'corporal'),
    ],
  },
  {
    key: 'mar', dayName: 'Martes', title: 'ESPALDA',
    exercises: [
      ex('jalon-abierto', 'Jalón al pecho, agarre abierto prono', 5, R(), 'polea'),
      ex('jalon-supino', 'Jalón al pecho, agarre cerrado supino', 5, R(), 'polea'),
      ex('remo-polea-neutral', 'Remo en polea, agarre neutral cerrado', 5, R(), 'polea'),
      ex('remo-polea-prono', 'Remo en polea, agarre prono abierto', 5, R(), 'polea'),
      ex('remo-barra', 'Remo con barra prono', 5, R(), 'barra'),
      ex('remo-mancuerna', 'Remo con mancuerna a un brazo', 4, F(15), 'mancuerna', true),
    ],
  },
  {
    key: 'mie', dayName: 'Miércoles', title: 'HOMBRO',
    exercises: [
      ex('press-militar', 'Press de hombro con barra', 5, R(), 'barra'),
      ex('press-arnold', 'Press Arnold', 5, R(), 'mancuerna'),
      ex('laterales', 'Elevaciones laterales', 5, R(), 'mancuerna'),
      ex('frontales', 'Elevaciones frontales', 5, R(), 'mancuerna'),
      ex('remo-vertical', 'Remo vertical', 5, R(), 'barra'),
      ex('face-pull', 'Face pull en polea', 5, R(), 'polea'),
    ],
  },
  {
    key: 'jue', dayName: 'Jueves', title: 'BÍCEPS, TRÍCEPS Y ABDOMEN',
    exercises: [
      ex('curl-inclinado', 'Curl de bíceps en banco inclinado', 4, R(), 'mancuerna'),
      ex('curl-21s', '21s con barra Z (7 + 7 + 7)', 4, { kind: '21s' }, 'barra'),
      ex('martillo-cuerda', 'Curl martillo en polea con cuerda', 4, R(), 'polea'),
      ex('ext-triceps-polea', 'Extensión de tríceps en polea', 4, R(), 'polea'),
      ex('press-frances', 'Press francés con mancuernas', 4, R(), 'mancuerna'),
      ex('press-california', 'Press California con barra', 4, R(), 'barra'),
      ex('sit-ups', 'Abdominales (sit-ups)', 4, F(15), 'corporal'),
      ex('leg-raise', 'Elevación de piernas', 4, F(15), 'corporal'),
      ex('v-ups', 'V-ups', 4, F(15), 'corporal'),
    ],
  },
  {
    key: 'vie', dayName: 'Viernes', title: 'PIERNA',
    exercises: [
      ex('sentadilla', 'Sentadilla', 5, R(), 'barra'),
      ex('desplante-fijo', 'Desplante con la misma pierna', 4, F(10), 'mancuerna', true),
      ex('peso-muerto', 'Peso muerto', 5, R(), 'barra'),
      ex('bulgaro', 'Desplante búlgaro', 4, F(10), 'mancuerna', true),
      ex('extension-cuadriceps', 'Extensión de pierna en máquina', 5, R(), 'maquina'),
      ex('curl-femoral', 'Curl femoral en máquina', 5, R(), 'maquina'),
      ex('pantorrilla-abierto', 'Elevación de pantorrilla con barra, pies abiertos', 4, F(10), 'barra'),
      ex('pantorrilla-neutral', 'Elevación de pantorrilla con barra, pies neutros', 4, F(10), 'barra'),
      ex('pantorrilla-cerrado', 'Elevación de pantorrilla con barra, pies cerrados', 4, F(10), 'barra'),
      ex('pantorrilla-1pierna', 'Elevación de pantorrilla a una pierna con mancuerna', 4, F(15), 'mancuerna', true),
    ],
  },
]

export const GYM_DAY_BY_KEY: ReadonlyMap<GymDayKey, GymDay> = new Map(GYM_DAYS.map((d) => [d.key, d]))

export const EXERCISE_BY_ID: ReadonlyMap<string, Exercise> = new Map(
  GYM_DAYS.flatMap((d) => d.exercises.map((e) => [e.id, e] as const)),
)

/** Suggested load increment by equipment (kg). null: next plate / reps only. */
export const INCREMENT_KG: Record<Equipment, number | null> = {
  barra: 2.5,
  mancuerna: 2,
  maquina: null,
  polea: null,
  corporal: null,
}

export const REST_DEFAULT_SEC = 75
export const REST_OPTIONS_SEC = [60, 75, 90] as const

export const GYM_RULES = [
  'Quedarse a 1–2 repeticiones del fallo.',
  'Registrar el peso de cada serie.',
  'Al terminar: 20–25 min de cardio post-gym.',
] as const

/** Reduced volume: 5-set exercises become 4 sets. */
export const setsFor = (e: Exercise, reducedVolume: boolean) => (reducedVolume && e.sets === 5 ? 4 : e.sets)

export const REDUCED_VOLUME_HINT =
  'Se sugiere si la sesión dura más de 80 min o si se marca "No me recuperé" dos veces en una semana.'

/** Main lifts tracked as records in Progreso. */
export const RECORD_EXERCISES = [
  'press-banca',
  'press-inclinado-barra',
  'jalon-abierto',
  'remo-barra',
  'press-militar',
  'sentadilla',
  'peso-muerto',
] as const
