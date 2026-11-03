// CONTENT §0 and §12.
export const PROFILE = {
  heightCm: 178,
  startWeightKg: 100,
  bodyFatPct: 36,
  goalKg: 85,
  /** Expected pace, kg/week. The first 2 weeks can be faster (water). */
  pace: { min: 0.7, max: 1.0 },
  work: { start: '09:00', end: '13:00' },
  /** Reference only; never shown as a target. */
  energy: { kcal: 1700, proteinG: 140 },
} as const

export const WATER = { goalMl: 3000, cellMl: 250, cells: 12, lowMl: 2000 } as const

export type Supplement = { id: string; name: string; when: string; note: string }

export const SUPPLEMENTS: readonly Supplement[] = [
  { id: 'pre', name: 'Pre-entreno o café', when: '15–20 min antes del gym', note: 'Nada de cafeína después de las 14:00' },
  { id: 'creatina', name: 'Creatina', when: 'Diario, junto con el pre-entreno', note: '5 g por defecto, editable. 3–5 g es suficiente' },
  { id: 'proteina', name: 'Proteína iso', when: 'Después del gym, en el licuado del desayuno', note: 'Cuenta como los 3 bloques de proteína del desayuno' },
]

export const CREATINE_DEFAULT_G = 5
