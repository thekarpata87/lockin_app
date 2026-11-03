/** Food groups (CONTENT §2.1). */
export type Group = 'V' | 'F' | 'C' | 'P' | 'L' | 'G'
export const GROUP_ORDER: readonly Group[] = ['V', 'F', 'C', 'P', 'L', 'G']

export type Blocks = Partial<Record<Group, number>>

/** Meal slots (CONTENT §1.1 / §2.2). */
export type MealKey = 'pre' | 'desayuno' | 'colacion' | 'comida' | 'cena'
export const MEAL_ORDER: readonly MealKey[] = ['pre', 'desayuno', 'colacion', 'comida', 'cena']

export type Unit =
  | 'g'
  | 'ml'
  | 'pza'
  | 'taza'
  | 'cda'
  | 'cdita'
  | 'rebanada'
  | 'scoop'
  | 'lata'
  | 'paquete'
  | 's'

export type Amount = { amount: number; unit: Unit }

export type ShopSection =
  | 'carnes'
  | 'lacteos'
  | 'frutas'
  | 'verduras'
  | 'abarrotes'
  | 'tortilleria'
  | 'panaderia'

export type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'
export const DAY_ORDER: readonly DayKey[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
