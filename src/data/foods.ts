// CONTENT §2 (block system) and §5 (shopping conversions).
import type { Amount, Blocks, Group, MealKey, ShopSection } from './types'

export const GROUPS: Record<Group, { name: string; kcal: number }> = {
  V: { name: 'Verduras', kcal: 25 },
  F: { name: 'Frutas', kcal: 60 },
  C: { name: 'Cereales', kcal: 70 },
  P: { name: 'Proteína', kcal: 50 },
  L: { name: 'Leche', kcal: 95 },
  G: { name: 'Grasas', kcal: 45 },
}

export const MEALS: Record<MealKey, { name: string; blocks: Blocks }> = {
  pre: { name: 'Pre-entreno', blocks: { F: 1 } },
  desayuno: { name: 'Desayuno', blocks: { F: 1, P: 3, L: 1 } },
  colacion: { name: 'Colación', blocks: { V: 1, C: 1, P: 3, G: 1 } },
  comida: { name: 'Comida', blocks: { V: 2, C: 3, P: 6, G: 1 } },
  cena: { name: 'Cena', blocks: { V: 1, C: 2, P: 4, G: 1 } },
}

export const SHOP_SECTIONS: Record<ShopSection, string> = {
  carnes: 'Carnes y pescados',
  lacteos: 'Lácteos y huevo',
  frutas: 'Frutas',
  verduras: 'Verduras',
  abarrotes: 'Abarrotes',
  tortilleria: 'Tortillería',
  panaderia: 'Panadería',
}

/** How a food is bought (CONTENT §5). */
export type Purchase =
  /** Sold by weight. Raw grams per block = cooked grams × rawFactor, or rawGrams. */
  | { kind: 'weight'; rawFactor?: number; rawGramsPerBlock?: number; roundTo?: number }
  /** Sold in units that hold a known number of blocks. */
  | { kind: 'unit'; unit: string; unitPlural: string; blocksPerUnit: number; roundTo?: readonly number[] }

export type Food = {
  id: string
  name: string
  group: Group
  /** What 1 block is, in the unit recipes use. */
  perBlock: Amount
  /** Human description of 1 block, as written in CONTENT. */
  portion: string
  /** Approximate cooked/served grams per block, when known. */
  grams?: number
  section: ShopSection
  purchase?: Purchase
}

const MEAT: Purchase = { kind: 'weight', rawFactor: 1.25 }
const SAME_WEIGHT: Purchase = { kind: 'weight', rawFactor: 1 }
const VEG: Purchase = { kind: 'weight', rawFactor: 1, roundTo: 100 }

const protein: Food[] = [
  { id: 'pollo', name: 'Pechuga de pollo sin piel', group: 'P', perBlock: { amount: 30, unit: 'g' }, portion: '30 g', grams: 30, section: 'carnes', purchase: MEAT },
  { id: 'res', name: 'Bistec de res', group: 'P', perBlock: { amount: 30, unit: 'g' }, portion: '30 g', grams: 30, section: 'carnes', purchase: MEAT },
  { id: 'cerdo', name: 'Lomo de cerdo', group: 'P', perBlock: { amount: 40, unit: 'g' }, portion: '40 g', grams: 40, section: 'carnes', purchase: MEAT },
  { id: 'pescado', name: 'Filete de pescado blanco', group: 'P', perBlock: { amount: 40, unit: 'g' }, portion: '40 g', grams: 40, section: 'carnes', purchase: MEAT },
  { id: 'salmon', name: 'Salmón', group: 'P', perBlock: { amount: 30, unit: 'g' }, portion: '30 g', grams: 30, section: 'carnes', purchase: MEAT },
  { id: 'camaron', name: 'Camarón mediano pelado', group: 'P', perBlock: { amount: 5, unit: 'pza' }, portion: '5 pzas', grams: 35, section: 'carnes', purchase: MEAT },
  { id: 'atun', name: 'Atún en agua', group: 'P', perBlock: { amount: 1 / 3, unit: 'lata' }, portion: '⅓ lata', grams: 33, section: 'abarrotes', purchase: { kind: 'unit', unit: 'lata de 140 g', unitPlural: 'latas de 140 g', blocksPerUnit: 3 } },
  { id: 'panela', name: 'Queso panela reducido en grasa', group: 'P', perBlock: { amount: 1, unit: 'rebanada' }, portion: '1 rebanada (40 g)', grams: 40, section: 'lacteos', purchase: { kind: 'unit', unit: 'paquete de 400 g', unitPlural: 'paquetes de 400 g', blocksPerUnit: 10 } },
  { id: 'huevo', name: 'Huevo entero', group: 'P', perBlock: { amount: 1, unit: 'pza' }, portion: '1 pza', grams: 50, section: 'lacteos', purchase: { kind: 'unit', unit: 'pieza', unitPlural: 'piezas', blocksPerUnit: 1, roundTo: [12, 18] } },
  { id: 'claras', name: 'Claras de huevo', group: 'P', perBlock: { amount: 2, unit: 'pza' }, portion: '2 claras', grams: 66, section: 'lacteos', purchase: { kind: 'unit', unit: 'litro de claras', unitPlural: 'litros de claras', blocksPerUnit: 15 } },
  { id: 'pavo', name: 'Jamón o pechuga de pavo', group: 'P', perBlock: { amount: 2, unit: 'rebanada' }, portion: '2 rebanadas', grams: 40, section: 'lacteos', purchase: { kind: 'unit', unit: 'paquete de 250 g', unitPlural: 'paquetes de 250 g', blocksPerUnit: 6 } },
  { id: 'whey', name: 'Proteína en polvo', group: 'P', perBlock: { amount: 1 / 3, unit: 'scoop' }, portion: '⅓ scoop', grams: 10, section: 'abarrotes' },
]

const cereal: Food[] = [
  { id: 'tortilla', name: 'Tortilla de maíz', group: 'C', perBlock: { amount: 1, unit: 'pza' }, portion: '1 pza', section: 'tortilleria', purchase: { kind: 'unit', unit: 'kg', unitPlural: 'kg', blocksPerUnit: 33 } },
  { id: 'arroz', name: 'Arroz cocido', group: 'C', perBlock: { amount: 0.25, unit: 'taza' }, portion: '¼ taza (~40 g cocido, ~14 g crudo)', grams: 40, section: 'abarrotes', purchase: { kind: 'weight', rawGramsPerBlock: 14 } },
  { id: 'pasta', name: 'Pasta cocida', group: 'C', perBlock: { amount: 0.5, unit: 'taza' }, portion: '½ taza (~70 g cocida, ~30 g cruda)', grams: 70, section: 'abarrotes', purchase: { kind: 'weight', rawGramsPerBlock: 30 } },
  { id: 'panIntegral', name: 'Pan integral', group: 'C', perBlock: { amount: 1, unit: 'rebanada' }, portion: '1 rebanada', section: 'abarrotes' },
  { id: 'bolillo', name: 'Bolillo sin migajón', group: 'C', perBlock: { amount: 0.5, unit: 'pza' }, portion: '½ pza', section: 'panaderia' },
  { id: 'avena', name: 'Avena en hojuelas', group: 'C', perBlock: { amount: 0.25, unit: 'taza' }, portion: '¼ taza (~20 g)', grams: 20, section: 'abarrotes' },
  { id: 'papa', name: 'Papa cocida', group: 'C', perBlock: { amount: 0.5, unit: 'pza' }, portion: '½ pza mediana (~85 g)', grams: 85, section: 'verduras', purchase: SAME_WEIGHT },
  { id: 'elote', name: 'Elote desgranado', group: 'C', perBlock: { amount: 0.5, unit: 'taza' }, portion: '½ taza (~80 g)', grams: 80, section: 'verduras', purchase: SAME_WEIGHT },
  { id: 'tostadas', name: 'Tostadas horneadas', group: 'C', perBlock: { amount: 20, unit: 'g' }, portion: '20 g (~2 pzas)', grams: 20, section: 'abarrotes' },
  { id: 'salmas', name: 'Salmas', group: 'C', perBlock: { amount: 1, unit: 'paquete' }, portion: '1 paquete individual', section: 'abarrotes' },
  { id: 'totopos', name: 'Totopos horneados', group: 'C', perBlock: { amount: 22, unit: 'g' }, portion: '22 g', grams: 22, section: 'abarrotes' },
  { id: 'pita', name: 'Pan pita', group: 'C', perBlock: { amount: 1 / 3, unit: 'pza' }, portion: '⅓ pza', section: 'abarrotes' },
  { id: 'crotones', name: 'Crotones', group: 'C', perBlock: { amount: 0.5, unit: 'taza' }, portion: '½ taza (~15 g)', grams: 15, section: 'abarrotes' },
  { id: 'palomitas', name: 'Palomitas naturales', group: 'C', perBlock: { amount: 1.5, unit: 'taza' }, portion: '1.5 tazas', section: 'abarrotes' },
  { id: 'amaranto', name: 'Amaranto', group: 'C', perBlock: { amount: 0.25, unit: 'taza' }, portion: '¼ taza', section: 'abarrotes' },
  { id: 'quinoaInflada', name: 'Quinoa inflada', group: 'C', perBlock: { amount: 16, unit: 'g' }, portion: '16 g', grams: 16, section: 'abarrotes' },
  { id: 'cambray', name: 'Papitas cambray', group: 'C', perBlock: { amount: 5, unit: 'pza' }, portion: '5 pzas', section: 'verduras' },
  { id: 'habaneras', name: 'Galletas habaneras', group: 'C', perBlock: { amount: 4, unit: 'pza' }, portion: '4 pzas', section: 'abarrotes' },
]

// CONTENT lists vegetables, fruits, milk and fats without IDs; these slugs are derived from their names.
const vegNames: [string, string][] = [
  ['lechuga', 'Lechuga'], ['espinaca', 'Espinaca'], ['pepino', 'Pepino'], ['jitomate', 'Jitomate'],
  ['cebolla', 'Cebolla'], ['pimiento', 'Pimiento'], ['calabacita', 'Calabacita'], ['brocoli', 'Brócoli'],
  ['coliflor', 'Coliflor'], ['nopales', 'Nopales'], ['champinones', 'Champiñones'], ['ejotes', 'Ejotes'],
  ['zanahoria', 'Zanahoria'], ['esparragos', 'Espárragos'], ['chayote', 'Chayote'],
]
const vegetables: Food[] = vegNames.map(([id, name]) => ({
  id, name, group: 'V', perBlock: { amount: 1, unit: 'taza' }, portion: '1 taza', section: 'verduras', purchase: VEG,
}))

const fruit = (id: string, name: string, amount: number, unit: 'pza' | 'taza', portion: string): Food => ({
  id, name, group: 'F', perBlock: { amount, unit }, portion, section: 'frutas', purchase: SAME_WEIGHT,
})
const fruits: Food[] = [
  fruit('manzana', 'Manzana', 1, 'pza', '1 pza'),
  fruit('fresa', 'Fresa rebanada', 1, 'taza', '1 taza'),
  fruit('platano', 'Plátano', 0.5, 'pza', '½ pza'),
  fruit('guayaba', 'Guayaba', 3, 'pza', '3 pzas'),
  fruit('mango', 'Mango', 0.5, 'pza', '½ pza'),
  fruit('blueberries', 'Blueberries', 0.75, 'taza', '¾ taza'),
  fruit('higo', 'Higo', 2, 'pza', '2 pzas'),
  fruit('melon', 'Melón', 1, 'taza', '1 taza'),
  fruit('papaya', 'Papaya', 1, 'taza', '1 taza'),
  fruit('pera', 'Pera', 0.5, 'pza', '½ pza'),
  fruit('tuna', 'Tuna', 2, 'pza', '2 pzas'),
  fruit('kiwi', 'Kiwi', 1, 'pza', '1 pza'),
  fruit('durazno', 'Durazno', 2, 'pza', '2 pzas'),
  fruit('frambuesa', 'Frambuesas', 1, 'taza', '1 taza'),
  fruit('pina', 'Piña', 0.75, 'taza', '¾ taza'),
  fruit('mandarina', 'Mandarina', 2, 'pza', '2 pzas'),
  fruit('sandia', 'Sandía', 1, 'taza', '1 taza'),
  fruit('toronja', 'Toronja', 0.5, 'pza', '½ pza'),
  fruit('uvas', 'Uvas', 1, 'taza', '1 taza'),
]

const milk: Food[] = [
  { id: 'leche', name: 'Leche descremada o deslactosada light', group: 'L', perBlock: { amount: 250, unit: 'ml' }, portion: '1 taza (250 ml)', section: 'lacteos', purchase: { kind: 'unit', unit: 'litro', unitPlural: 'litros', blocksPerUnit: 4 } },
  { id: 'yogurtGriego', name: 'Yogurt griego o natural sin azúcar', group: 'L', perBlock: { amount: 0.75, unit: 'taza' }, portion: '¾ taza (~180 g)', grams: 180, section: 'lacteos', purchase: { kind: 'unit', unit: 'kg', unitPlural: 'kg', blocksPerUnit: 5.5 } },
  { id: 'yogurtBebible', name: 'Yogurt bebible sin endulzar', group: 'L', perBlock: { amount: 1, unit: 'pza' }, portion: '1 pza', section: 'lacteos' },
]

const fats: Food[] = [
  { id: 'aceite', name: 'Aceite o aceite de oliva', group: 'G', perBlock: { amount: 1, unit: 'cdita' }, portion: '1 cdita', section: 'abarrotes' },
  { id: 'aerosol', name: 'Aceite en aerosol', group: 'G', perBlock: { amount: 5, unit: 's' }, portion: '5 segundos', section: 'abarrotes' },
  { id: 'aguacate', name: 'Aguacate', group: 'G', perBlock: { amount: 0.25, unit: 'pza' }, portion: '¼ pza', section: 'verduras', purchase: { kind: 'unit', unit: 'pieza', unitPlural: 'piezas', blocksPerUnit: 4 } },
  { id: 'mantequilla', name: 'Mantequilla', group: 'G', perBlock: { amount: 1, unit: 'cdita' }, portion: '1 cdita', section: 'lacteos' },
  { id: 'mayonesa', name: 'Mayonesa', group: 'G', perBlock: { amount: 1, unit: 'cdita' }, portion: '1 cdita', section: 'abarrotes' },
  { id: 'crema', name: 'Crema', group: 'G', perBlock: { amount: 1, unit: 'cda' }, portion: '1 cda', section: 'lacteos' },
  { id: 'guacamole', name: 'Guacamole', group: 'G', perBlock: { amount: 2, unit: 'cda' }, portion: '2 cdas', section: 'verduras' },
  { id: 'quesoCrema', name: 'Queso crema', group: 'G', perBlock: { amount: 1, unit: 'cda' }, portion: '1 cda', section: 'lacteos' },
]

export const FOODS: readonly Food[] = [...protein, ...cereal, ...vegetables, ...fruits, ...milk, ...fats]

export const FOOD_BY_ID: ReadonlyMap<string, Food> = new Map(FOODS.map((f) => [f.id, f]))

export function getFood(id: string): Food {
  const f = FOOD_BY_ID.get(id)
  if (!f) throw new Error(`Unknown food: ${id}`)
  return f
}

export const foodsInGroup = (g: Group) => FOODS.filter((f) => f.group === g)

export const VEG_NOTE = 'Las verduras de hoja y el pepino puedes repetirlos si te quedas con hambre.'
export const VEG_PORTION_NOTE =
  '1 bloque = 1 taza cocida al vapor o cruda en ensalada. Se pueden aderezar con limón, Tajín, especias o salsa sin aceite.'
export const PROTEIN_NOTE = 'Los pesos son en cocido. No freír ni empanizar.'

/** Pre-workout quick options (CONTENT §3.1). */
export const PRE_OPTIONS: readonly { foodId: string; amount: number; unit: 'pza' }[] = [
  { foodId: 'manzana', amount: 1, unit: 'pza' },
  { foodId: 'platano', amount: 0.5, unit: 'pza' },
  { foodId: 'mandarina', amount: 2, unit: 'pza' },
  { foodId: 'kiwi', amount: 1, unit: 'pza' },
]
