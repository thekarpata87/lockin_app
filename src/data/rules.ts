// CONTENT §6 (storage), §7 (Sunday prep), §10 (do / don't), §11 (suggestions), §13 (measures).
import type { PrepTask } from './recipes'

export type StorageRow = { food: string; fridge: string; freezer: string; note?: string }

export const STORAGE: readonly StorageRow[] = [
  { food: 'Pollo, res o cerdo cocidos', fridge: '3–4 días', freezer: '2–3 meses', note: 'Enfriar y guardar en menos de 2 h' },
  { food: 'Arroz cocido', fridge: '3–4 días', freezer: '1–2 meses', note: 'Extenderlo para que enfríe rápido' },
  { food: 'Pasta cocida', fridge: '3–5 días', freezer: '1–2 meses' },
  { food: 'Pescado o camarón cocidos', fridge: '2 días', freezer: 'Mejor congelar crudo', note: 'Preferir cocinarlo fresco' },
  { food: 'Verdura cocida', fridge: '3–4 días', freezer: 'Congelar aparte' },
  { food: 'Verdura cruda picada', fridge: '4–5 días', freezer: 'No', note: 'Contenedor con una servilleta' },
  { food: 'Lechuga lavada', fridge: '4–5 días', freezer: 'No', note: 'Bien seca' },
  { food: 'Aguacate', fridge: 'Partir al momento', freezer: '–' },
  { food: 'Guacamole', fridge: '1–2 días', freezer: '–', note: 'Plástico pegado a la superficie' },
]

/** Lunes a miércoles → refri; jueves a sábado → congelador. */
export const FRIDGE_DAYS = ['lun', 'mar', 'mie'] as const
export const FREEZER_DAYS = ['jue', 'vie', 'sab'] as const

export const STORAGE_RULES = {
  nightly: 'Pasa el contenedor del día siguiente del congelador al refri cada noche.',
  reheat: 'Recalentar hasta que salga vapor (74 °C).',
  freshWarning: 'Esta receta conviene prepararla fresca ese día.',
} as const

export type PrepCondition = { kind: 'always' } | { kind: 'task'; task: PrepTask }

export type PrepStep = {
  id: string
  /** Minutes from the start. */
  startMin: number
  text: string
  /** Optional timer, in minutes (range when CONTENT gives one; the timer uses max). */
  timerMin?: { min: number; max: number }
  when: PrepCondition
}

const always: PrepCondition = { kind: 'always' }
const task = (t: PrepTask): PrepCondition => ({ kind: 'task', task: t })
const t = (min: number, max = min) => ({ min, max })

export const PREP_TEMPLATE: readonly PrepStep[] = [
  { id: 'p-setup', startMin: 0, text: 'Precalentar el horno a 200 °C. Sacar la báscula, las charolas y 12 contenedores', when: always },
  { id: 'p-arroz', startMin: 5, text: 'Arroz: 1 taza de arroz por 2 de agua. Hervir, tapar y fuego bajo', timerMin: t(20), when: task('arroz') },
  { id: 'p-pollo', startMin: 10, text: 'Pollo: sazonar con sal, pimienta, ajo en polvo, paprika y limón. Charola con aerosol, al horno', timerMin: t(25, 30), when: task('pollo') },
  { id: 'p-picar', startMin: 15, text: 'Mientras tanto: lavar, desinfectar y picar las verduras crudas', when: always },
  { id: 'p-vapor', startMin: 30, text: 'Verduras al vapor (brócoli, calabacita, ejotes, zanahoria)', timerMin: t(6), when: task('vapor') },
  { id: 'p-res', startMin: 40, text: 'Bistec a la plancha, 3–4 min por lado', timerMin: t(8), when: task('res') },
  { id: 'p-cerdo', startMin: 40, text: 'Lomo de cerdo en sartén o al horno, hasta 63 °C por dentro; reposar 3 min', timerMin: t(15), when: task('cerdo') },
  { id: 'p-nopales', startMin: 50, text: 'Nopales y cebolla asados en comal', timerMin: t(10), when: task('nopales') },
  { id: 'p-pasta', startMin: 50, text: 'Pasta en agua hirviendo con sal', timerMin: t(9), when: task('pasta') },
  { id: 'p-deshebrar', startMin: 60, text: 'Deshebrar el pollo para tacos y quesadillas', when: task('deshebrar') },
  { id: 'p-enfriar', startMin: 65, text: 'Extender todo en charolas para enfriar', timerMin: t(20), when: always },
  { id: 'p-pesar', startMin: 85, text: 'Pesar las porciones cocidas y armar los contenedores según la semana', when: always },
  { id: 'p-etiquetar', startMin: 105, text: 'Etiquetar con día y receta. Refri: lunes a miércoles. Congelador: jueves a sábado', when: always },
]

export const PREP_DURATION = '1 h 45 min a 2 h'

export const DO_FREELY = [
  'Agua natural (3 L o más)',
  'Café sin azúcar',
  'Té',
  'Verduras de hoja y pepino (se pueden repetir)',
  'Salsas sin aceite',
  'Limón, Tajín y especias',
] as const

export const DO_IN_MODERATION = [
  'Refresco o bebida cero: máximo 1 al día',
  'Endulzante sin calorías: con moderación',
  'Comida flexible: 1 por semana, una sola comida y no un día completo. Sugerida el domingo',
] as const

export const DONT = [
  'Refrescos normales y jugos (incluidos los "naturales")',
  'Pan dulce, galletas y postres',
  'Frituras, empanizados y capeados',
  'Botanas fuera de los bloques',
  'Aderezos cremosos fuera del bloque de grasa',
  'Cocinar con aceite sin medirlo: usar aerosol o 1 cdita medida',
] as const

export const FLEX_MEALS_PER_WEEK = 1

export type SuggestionId = 'plateau' | 'tooFast' | 'fewWeighIns' | 'lowWater' | 'lateSleep' | 'longSessions'

/** Shown as cards only; the app never changes the plan by itself. Logic lives in lib/progress.ts. */
export const SUGGESTIONS: Record<SuggestionId, { rule: string; message: string }> = {
  plateau: {
    rule: 'El promedio semanal no baja en 2 semanas seguidas (con 4 o más registros por semana)',
    message: 'Tu promedio no ha bajado en 2 semanas. Opciones: quitar 1 cereal de la cena o sumar 2,000 pasos diarios.',
  },
  tooFast: {
    rule: 'Después del día 28, baja más de 1.5 kg por semana 2 semanas seguidas',
    message: 'Estás bajando muy rápido. Agrega 1 cereal en la comida para cuidar tu músculo.',
  },
  fewWeighIns: {
    rule: 'Menos de 4 registros de peso en la semana',
    message: 'Pésate al menos 4 mañanas por semana para que el promedio sea confiable.',
  },
  lowWater: {
    rule: '3 días seguidos con menos de 2 L de agua',
    message: 'Llevas 3 días bajo 2 L de agua. Meta: 3 L.',
  },
  lateSleep: {
    rule: '3 noches seguidas sin dormir a la hora meta',
    message: 'Dormir menos de 7 h aumenta el hambre. Intenta adelantar 30 min hoy.',
  },
  longSessions: {
    rule: 'Sesión de gym de más de 80 min, 2 veces en la semana',
    message: 'Tus sesiones pasan de 80 min. Prueba el volumen reducido en Ajustes.',
  },
}

export const SUGGESTION_THRESHOLDS = {
  minWeighInsPerWeek: 4,
  tooFastAfterDay: 28,
  tooFastKgPerWeek: 1.5,
  lowWaterMl: 2000,
  streakDays: 3,
  longSessionMin: 80,
  longSessionsPerWeek: 2,
} as const

export const WEIGH_IN_GUIDE =
  'En la mañana, después de ir al baño, antes de comer y con poca ropa. Lo que cuenta es el promedio semanal, no el número de un solo día. Medir la cintura cada 2 semanas a la altura del ombligo.'

export const MEASURES_GUIDE: readonly { measure: string; equals: string }[] = [
  { measure: '1 taza (arroz, ensalada, fruta)', equals: 'Un puño' },
  { measure: '1 cucharada', equals: 'El tamaño de tu pulgar' },
  { measure: '1 cucharadita', equals: 'La punta de tu dedo índice' },
  { measure: '30 g de proteína cocida', equals: 'La palma de la mano con el grosor del dedo meñique' },
  { measure: '90 g de proteína cocida', equals: 'La palma completa con su grosor total' },
]

export const MEASURES_NOTE =
  'Las "tazas" y "cucharadas" del plan se refieren a tazas y cucharas medidoras, no a las de cocina comunes.'
