// Shopping list (CONTENT §5): cooked → raw, rounded up to purchase units, grouped by store section.
import { FOOD_BY_ID, SHOP_SECTIONS, SHOP_WEIGHTS } from '../data/foods'
import type { Food } from '../data/foods'
import type { ShopSection, Unit } from '../data/types'
import type { WeekPlan } from '../db/schema'
import { itemBlocks } from './blocks'
import { plannedMeals } from './plan'

export type ShopItem = { id: string; name: string; qty: string; detail: string; section: ShopSection }
export type ShopGroup = { section: ShopSection; title: string; items: ShopItem[] }

const SECTION_ORDER: ShopSection[] = ['carnes', 'lacteos', 'frutas', 'verduras', 'abarrotes', 'tortilleria', 'panaderia']

const ceilTo = (n: number, step: number) => Math.ceil(n / step - 1e-9) * step
const r2 = (n: number) => Math.round(n * 100) / 100

export function formatGrams(g: number): string {
  if (g < 1000) return `${g} g`
  return `${String(Number((g / 1000).toFixed(3)))} kg`
}

const UNIT_WORD: Record<Unit, [string, string]> = {
  g: ['g', 'g'],
  ml: ['ml', 'ml'],
  pza: ['pieza', 'piezas'],
  taza: ['taza', 'tazas'],
  cda: ['cucharada', 'cucharadas'],
  cdita: ['cucharadita', 'cucharaditas'],
  rebanada: ['rebanada', 'rebanadas'],
  scoop: ['scoop', 'scoops'],
  lata: ['lata', 'latas'],
  paquete: ['paquete', 'paquetes'],
  s: ['uso de 5 s', 'usos de 5 s'],
}

const fmt = (n: number) => String(Number(n.toFixed(2)))
const plural = (n: number, [one, many]: [string, string]) => `${fmt(n)} ${n === 1 ? one : many}`
const blocksText = (b: number) => `${fmt(b)} ${b === 1 ? 'bloque' : 'bloques'}`

function line(food: Food, blocks: number): { qty: string; detail: string } {
  const p = food.purchase
  const perUnitAmount = blocks * food.perBlock.amount // total in recipe units

  if (p?.kind === 'unit') {
    let n = ceilTo(blocks / p.blocksPerUnit, p.step ?? 1)
    if (p.roundTo) n = p.roundTo.find((r) => r >= n) ?? ceilTo(n, 6)
    return { qty: plural(n, [p.unit, p.unitPlural]), detail: blocksText(blocks) }
  }

  if (p?.kind === 'weight') {
    const w = SHOP_WEIGHTS[food.id]
    // Pieces (fruit by piece): count them.
    if (food.perBlock.unit === 'pza' && !food.grams) {
      const n = Math.ceil(perUnitAmount - 1e-9)
      return { qty: plural(n, UNIT_WORD.pza), detail: blocksText(blocks) }
    }
    let cooked: number
    if (food.grams) cooked = blocks * food.grams
    else if (food.perBlock.unit === 'taza' && w?.cupG) cooked = perUnitAmount * w.cupG
    else return { qty: plural(r2(perUnitAmount), UNIT_WORD[food.perBlock.unit]), detail: blocksText(blocks) }

    const raw = p.rawGramsPerBlock ? blocks * p.rawGramsPerBlock : cooked * (p.rawFactor ?? 1)
    if (w?.pieceG) {
      const n = Math.ceil(raw / w.pieceG - 1e-9)
      return { qty: plural(n, UNIT_WORD.pza), detail: `~${Math.round(raw)} g` }
    }
    const rounded = ceilTo(raw, p.roundTo ?? 50)
    const isMeatLike = (p.rawFactor ?? 1) !== 1 || p.rawGramsPerBlock
    const detail = isMeatLike ? `crudo · ${formatGrams(Math.round(cooked))} cocido` : `~${Math.round(raw)} g`
    return { qty: formatGrams(rounded), detail }
  }

  // No purchase rule: show the total in recipe units.
  return { qty: plural(r2(perUnitAmount), UNIT_WORD[food.perBlock.unit]), detail: blocksText(blocks) }
}

/** Mon–Sat lunch and dinner plus 7 days of breakfast and snack, from the plan. */
export function shoppingList(plan: WeekPlan): ShopGroup[] {
  const blocksByFood = new Map<string, number>()
  for (const { recipe } of plannedMeals(plan)) {
    for (const ing of recipe.ingredients) {
      for (const it of ing.items ?? []) blocksByFood.set(it.foodId, (blocksByFood.get(it.foodId) ?? 0) + itemBlocks(it))
    }
  }
  const groups = new Map<ShopSection, ShopItem[]>()
  for (const [id, raw] of blocksByFood) {
    const food = FOOD_BY_ID.get(id)
    if (!food) continue
    const blocks = r2(raw)
    const { qty, detail } = line(food, blocks)
    const item: ShopItem = { id, name: food.name, qty, detail, section: food.section }
    groups.set(food.section, [...(groups.get(food.section) ?? []), item])
  }
  return SECTION_ORDER.filter((s) => groups.has(s)).map((s) => ({
    section: s,
    title: SHOP_SECTIONS[s],
    items: groups.get(s)!.sort((a, b) => a.name.localeCompare(b.name, 'es')),
  }))
}

export const PRE_SHOPPING_NOTE = 'Agrega 7 frutas para el pre-entreno (manzana, plátano, mandarina o kiwi).'
