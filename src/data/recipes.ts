// CONTENT §3. Quantities are per serving, in cooked/served weight.
import type { Amount, Group, MealKey } from './types'

export type RecipeTag = 'prep' | 'cong' | 'fresco'

/** Sunday prep tasks a recipe needs (drives lib/prep.ts, CONTENT §7). */
export type PrepTask = 'arroz' | 'pollo' | 'vapor' | 'res' | 'cerdo' | 'nopales' | 'pasta' | 'deshebrar'

export type RecipeItem = Amount & { foodId: string }

export type Ingredient = {
  text: string
  /** Block group this ingredient covers; absent for free extras (limón, salsa, especias). */
  group?: Group
  blocks?: number
  /** Structured quantities (first option when the text offers alternatives). */
  items?: RecipeItem[]
}

export type Recipe = {
  id: string
  meal: Exclude<MealKey, 'pre'>
  name: string
  ingredients: Ingredient[]
  steps: string[]
  minutes: number
  tags: RecipeTag[]
  /** Max days in the fridge; null when CONTENT gives none. */
  fridgeDays: number | null
  prepTasks: PrepTask[]
}

type It = [foodId: string, amount: number, unit: Amount['unit']]
const items = (...xs: It[]): RecipeItem[] => xs.map(([foodId, amount, unit]) => ({ foodId, amount, unit }))
const ing = (text: string, group?: Group, blocks?: number, ...xs: It[]): Ingredient =>
  group ? { text, group, blocks, items: xs.length ? items(...xs) : undefined } : { text }

export const RECIPES: readonly Recipe[] = [
  // §3.2 Desayuno (F1 · P3 · L1)
  {
    id: 'des-licuado-rojos', meal: 'desayuno', name: 'Licuado de frutos rojos',
    ingredients: [
      ing('1 scoop de proteína', 'P', 3, ['whey', 1, 'scoop']),
      ing('1 taza de fresas o frambuesas congeladas', 'F', 1, ['fresa', 1, 'taza']),
      ing('250 ml de leche descremada', 'L', 1, ['leche', 250, 'ml']),
      ing('Hielo y canela'),
    ],
    steps: ['Licuar todo 30 s'], minutes: 3, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'des-licuado-platano', meal: 'desayuno', name: 'Licuado de plátano',
    ingredients: [
      ing('1 scoop de proteína', 'P', 3, ['whey', 1, 'scoop']),
      ing('½ plátano', 'F', 1, ['platano', 0.5, 'pza']),
      ing('250 ml de leche descremada', 'L', 1, ['leche', 250, 'ml']),
      ing('Canela y espinaca opcional'),
    ],
    steps: ['Licuar todo 30 s'], minutes: 3, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'des-huevos-yogurt', meal: 'desayuno', name: 'Huevos con yogurt y fruta',
    ingredients: [
      ing('1 huevo + 4 claras', 'P', 3, ['huevo', 1, 'pza'], ['claras', 4, 'pza']),
      ing('¾ taza de yogurt griego natural', 'L', 1, ['yogurtGriego', 0.75, 'taza']),
      ing('1 manzana o 1 taza de papaya', 'F', 1, ['manzana', 1, 'pza']),
    ],
    steps: ['Revolver huevo y claras en sartén antiadherente sin aceite', 'Servir con el yogurt y la fruta'],
    minutes: 10, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'des-bowl-yogurt', meal: 'desayuno', name: 'Bowl de yogurt proteico',
    ingredients: [
      ing('¾ taza de yogurt griego natural', 'L', 1, ['yogurtGriego', 0.75, 'taza']),
      ing('1 scoop de proteína', 'P', 3, ['whey', 1, 'scoop']),
      ing('¾ taza de blueberries', 'F', 1, ['blueberries', 0.75, 'taza']),
      ing('Canela'),
    ],
    steps: ['Mezclar la proteína con el yogurt y agregar la fruta encima'],
    minutes: 3, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'des-omelette-pavo', meal: 'desayuno', name: 'Omelette de claras con pavo',
    ingredients: [
      ing('4 claras + 2 rebanadas de pavo', 'P', 3, ['claras', 4, 'pza'], ['pavo', 2, 'rebanada']),
      ing('Espinaca o champiñón al gusto'),
      ing('1 taza de leche descremada o café con leche', 'L', 1, ['leche', 250, 'ml']),
      ing('1 taza de melón', 'F', 1, ['melon', 1, 'taza']),
    ],
    steps: ['Omelette en sartén antiadherente sin aceite'],
    minutes: 10, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },

  // §3.3 Colación (V1 · C1 · P3 · G1)
  {
    id: 'col-tostadas-atun', meal: 'colacion', name: 'Tostadas de atún',
    ingredients: [
      ing('1 lata de atún en agua drenado', 'P', 3, ['atun', 1, 'lata']),
      ing('1 taza de pepino, jitomate, cebolla y cilantro', 'V', 1, ['pepino', 0.4, 'taza'], ['jitomate', 0.4, 'taza'], ['cebolla', 0.2, 'taza']),
      ing('2 tostadas horneadas (20 g)', 'C', 1, ['tostadas', 20, 'g']),
      ing('¼ de aguacate', 'G', 1, ['aguacate', 0.25, 'pza']),
      ing('Limón y salsa'),
    ],
    steps: ['Mezclar el atún con la verdura picada y el limón', 'Servir sobre las tostadas con el aguacate'],
    minutes: 5, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'col-sandwich-pavo', meal: 'colacion', name: 'Sándwich abierto de pavo',
    ingredients: [
      ing('1 rebanada de pan integral', 'C', 1, ['panIntegral', 1, 'rebanada']),
      ing('4 rebanadas de pavo + 1 rebanada de panela', 'P', 3, ['pavo', 4, 'rebanada'], ['panela', 1, 'rebanada']),
      ing('1 taza de lechuga y jitomate', 'V', 1, ['lechuga', 0.5, 'taza'], ['jitomate', 0.5, 'taza']),
      ing('1 cdita de mayonesa', 'G', 1, ['mayonesa', 1, 'cdita']),
    ],
    steps: ['Armar sobre el pan'], minutes: 3, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'col-taco-pollo', meal: 'colacion', name: 'Taco de pollo',
    ingredients: [
      ing('90 g de pollo cocido del prep', 'P', 3, ['pollo', 90, 'g']),
      ing('1 tortilla', 'C', 1, ['tortilla', 1, 'pza']),
      ing('1 taza de lechuga y pico de gallo', 'V', 1, ['lechuga', 0.5, 'taza'], ['jitomate', 0.3, 'taza'], ['cebolla', 0.2, 'taza']),
      ing('2 cdas de guacamole', 'G', 1, ['guacamole', 2, 'cda']),
    ],
    steps: ['Calentar pollo y tortilla, armar el taco'], minutes: 5, tags: ['prep'], fridgeDays: null, prepTasks: ['pollo'],
  },
  {
    id: 'col-huevo-mexicana', meal: 'colacion', name: 'Huevo a la mexicana',
    ingredients: [
      ing('1 huevo + 4 claras', 'P', 3, ['huevo', 1, 'pza'], ['claras', 4, 'pza']),
      ing('1 taza de jitomate, cebolla y chile', 'V', 1, ['jitomate', 0.6, 'taza'], ['cebolla', 0.4, 'taza']),
      ing('1 tortilla', 'C', 1, ['tortilla', 1, 'pza']),
      ing('1 cdita de aceite', 'G', 1, ['aceite', 1, 'cdita']),
    ],
    steps: ['Sofreír la verdura con el aceite y agregar el huevo'], minutes: 10, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'col-ensalada-salmas', meal: 'colacion', name: 'Ensalada de pollo con salmas',
    ingredients: [
      ing('90 g de pollo cocido', 'P', 3, ['pollo', 90, 'g']),
      ing('1 taza de mix verde', 'V', 1, ['lechuga', 0.5, 'taza'], ['espinaca', 0.5, 'taza']),
      ing('1 paquete de salmas', 'C', 1, ['salmas', 1, 'paquete']),
      ing('¼ de aguacate', 'G', 1, ['aguacate', 0.25, 'pza']),
      ing('Limón'),
    ],
    steps: ['Mezclar todo y servir con las salmas'], minutes: 5, tags: ['prep'], fridgeDays: null, prepTasks: ['pollo'],
  },

  // §3.4 Comida (V2 · C3 · P6 · G1)
  {
    id: 'com-bowl-pollo', meal: 'comida', name: 'Bowl de pollo con arroz',
    ingredients: [
      ing('180 g de pollo', 'P', 6, ['pollo', 180, 'g']),
      ing('¾ taza de arroz cocido', 'C', 3, ['arroz', 0.75, 'taza']),
      ing('2 tazas de brócoli y calabacita al vapor', 'V', 2, ['brocoli', 1, 'taza'], ['calabacita', 1, 'taza']),
      ing('¼ de aguacate', 'G', 1, ['aguacate', 0.25, 'pza']),
    ],
    steps: ['Calentar pollo y arroz', 'Agregar la verdura y el aguacate al momento'],
    minutes: 5, tags: ['prep', 'cong'], fridgeDays: 4, prepTasks: ['arroz', 'pollo', 'vapor'],
  },
  {
    id: 'com-tacos-bistec', meal: 'comida', name: 'Tacos de bistec',
    ingredients: [
      ing('180 g de bistec', 'P', 6, ['res', 180, 'g']),
      ing('3 tortillas', 'C', 3, ['tortilla', 3, 'pza']),
      ing('2 tazas de nopales y cebolla asados', 'V', 2, ['nopales', 1.5, 'taza'], ['cebolla', 0.5, 'taza']),
      ing('5 s de aceite en aerosol', 'G', 1, ['aerosol', 5, 's']),
      ing('Salsa'),
    ],
    steps: ['Calentar el bistec en sartén con aerosol', 'Servir en tortillas con los nopales'],
    minutes: 10, tags: ['prep', 'cong'], fridgeDays: 4, prepTasks: ['res', 'nopales'],
  },
  {
    id: 'com-pasta-pollo', meal: 'comida', name: 'Pasta con pollo y espinaca',
    ingredients: [
      ing('180 g de pollo', 'P', 6, ['pollo', 180, 'g']),
      ing('1½ tazas de pasta cocida', 'C', 3, ['pasta', 1.5, 'taza']),
      ing('2 tazas de espinaca y champiñón', 'V', 2, ['espinaca', 1, 'taza'], ['champinones', 1, 'taza']),
      ing('1 cdita de aceite de oliva', 'G', 1, ['aceite', 1, 'cdita']),
      ing('Ajo'),
    ],
    steps: ['Saltear ajo, champiñón y espinaca con el aceite', 'Agregar pasta y pollo'],
    minutes: 10, tags: ['prep', 'cong'], fridgeDays: 4, prepTasks: ['pasta', 'pollo'],
  },
  {
    id: 'com-fajitas-pollo', meal: 'comida', name: 'Fajitas de pollo',
    ingredients: [
      ing('180 g de pollo en tiras', 'P', 6, ['pollo', 180, 'g']),
      ing('2 tazas de pimiento y cebolla', 'V', 2, ['pimiento', 1.5, 'taza'], ['cebolla', 0.5, 'taza']),
      ing('3 tortillas', 'C', 3, ['tortilla', 3, 'pza']),
      ing('2 cdas de guacamole', 'G', 1, ['guacamole', 2, 'cda']),
    ],
    steps: ['Saltear el pimiento y la cebolla sin aceite (o con agua)', 'Agregar el pollo y servir'],
    minutes: 10, tags: ['prep', 'cong'], fridgeDays: 4, prepTasks: ['pollo'],
  },
  {
    id: 'com-cerdo-elote', meal: 'comida', name: 'Lomo de cerdo con elote',
    ingredients: [
      ing('240 g de lomo de cerdo', 'P', 6, ['cerdo', 240, 'g']),
      ing('1½ tazas de elote desgranado', 'C', 3, ['elote', 1.5, 'taza']),
      ing('2 tazas de ejotes y zanahoria al vapor', 'V', 2, ['ejotes', 1, 'taza'], ['zanahoria', 1, 'taza']),
      ing('1 cdita de aceite', 'G', 1, ['aceite', 1, 'cdita']),
    ],
    steps: ['Calentar el lomo', 'Servir con el elote y la verdura'],
    minutes: 5, tags: ['prep', 'cong'], fridgeDays: 4, prepTasks: ['cerdo', 'vapor'],
  },
  {
    id: 'com-pescado-papa', meal: 'comida', name: 'Pescado con papa y ensalada',
    ingredients: [
      ing('240 g de filete de pescado', 'P', 6, ['pescado', 240, 'g']),
      ing('1½ papas medianas cocidas', 'C', 3, ['papa', 1.5, 'pza']),
      ing('2 tazas de ensalada', 'V', 2, ['lechuga', 1, 'taza'], ['jitomate', 0.5, 'taza'], ['pepino', 0.5, 'taza']),
      ing('1 cdita de aceite de oliva', 'G', 1, ['aceite', 1, 'cdita']),
      ing('Limón'),
    ],
    steps: ['Pescado a la plancha 3–4 min por lado', 'Papa cocida', 'Ensalada con aceite y limón'],
    minutes: 20, tags: ['fresco'], fridgeDays: 2, prepTasks: [],
  },
  {
    id: 'com-ensalada-crotones', meal: 'comida', name: 'Ensalada de pollo con crotones',
    ingredients: [
      ing('180 g de pollo', 'P', 6, ['pollo', 180, 'g']),
      ing('2 tazas de lechuga, espinaca, pepino y pimiento', 'V', 2, ['lechuga', 0.5, 'taza'], ['espinaca', 0.5, 'taza'], ['pepino', 0.5, 'taza'], ['pimiento', 0.5, 'taza']),
      ing('1½ tazas de crotones, agregarlos al momento', 'C', 3, ['crotones', 1.5, 'taza']),
      ing('1 cdita de aceite de oliva + limón', 'G', 1, ['aceite', 1, 'cdita']),
    ],
    steps: ['Armar en el momento con el pollo del prep'],
    minutes: 5, tags: ['prep'], fridgeDays: 4, prepTasks: ['pollo'],
  },
  {
    id: 'com-camarones-arroz', meal: 'comida', name: 'Camarones al ajo con arroz',
    ingredients: [
      ing('30 camarones medianos', 'P', 6, ['camaron', 30, 'pza']),
      ing('¾ taza de arroz', 'C', 3, ['arroz', 0.75, 'taza']),
      ing('2 tazas de calabacita y brócoli', 'V', 2, ['calabacita', 1, 'taza'], ['brocoli', 1, 'taza']),
      ing('1 cdita de aceite', 'G', 1, ['aceite', 1, 'cdita']),
      ing('Ajo'),
    ],
    steps: ['Saltear ajo y camarón con el aceite 3–4 min', 'Servir con arroz y verdura'],
    minutes: 15, tags: ['fresco'], fridgeDays: 2, prepTasks: [],
  },

  // §3.5 Cena (V1 · C2 · P4 · G1)
  {
    id: 'cen-ceviche-panela', meal: 'cena', name: 'Ceviche de panela',
    ingredients: [
      ing('4 rebanadas de panela (160 g)', 'P', 4, ['panela', 4, 'rebanada']),
      ing('1 taza de pepino, jitomate y cebolla', 'V', 1, ['pepino', 0.4, 'taza'], ['jitomate', 0.4, 'taza'], ['cebolla', 0.2, 'taza']),
      ing('2 paquetes de salmas o 4 tostadas horneadas', 'C', 2, ['salmas', 2, 'paquete']),
      ing('1 cdita de aceite de oliva o ¼ de aguacate', 'G', 1, ['aceite', 1, 'cdita']),
      ing('Limón, sal, pimienta y chile serrano opcional'),
    ],
    steps: ['Picar en cubos y mezclar con limón', 'Servir con las salmas'],
    minutes: 10, tags: ['fresco'], fridgeDays: 1, prepTasks: [],
  },
  {
    id: 'cen-tacos-pollo', meal: 'cena', name: 'Tacos de pollo deshebrado',
    ingredients: [
      ing('120 g de pollo', 'P', 4, ['pollo', 120, 'g']),
      ing('2 tortillas', 'C', 2, ['tortilla', 2, 'pza']),
      ing('1 taza de nopales o calabacita', 'V', 1, ['nopales', 1, 'taza']),
      ing('¼ de aguacate', 'G', 1, ['aguacate', 0.25, 'pza']),
      ing('Salsa'),
    ],
    steps: ['Calentar y armar los tacos'],
    minutes: 5, tags: ['prep', 'cong'], fridgeDays: 4, prepTasks: ['pollo', 'deshebrar', 'nopales'],
  },
  {
    id: 'cen-huevos-tortilla', meal: 'cena', name: 'Huevos con verdura',
    ingredients: [
      ing('2 huevos + 4 claras', 'P', 4, ['huevo', 2, 'pza'], ['claras', 4, 'pza']),
      ing('1 taza de espinaca y jitomate', 'V', 1, ['espinaca', 0.5, 'taza'], ['jitomate', 0.5, 'taza']),
      ing('2 tortillas', 'C', 2, ['tortilla', 2, 'pza']),
      ing('1 cdita de aceite', 'G', 1, ['aceite', 1, 'cdita']),
    ],
    steps: ['Saltear la verdura y agregar el huevo'],
    minutes: 10, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'cen-quesadillas', meal: 'cena', name: 'Quesadillas de panela y pollo',
    ingredients: [
      ing('2 tortillas', 'C', 2, ['tortilla', 2, 'pza']),
      ing('2 rebanadas de panela + 60 g de pollo', 'P', 4, ['panela', 2, 'rebanada'], ['pollo', 60, 'g']),
      ing('1 taza de champiñón y espinaca', 'V', 1, ['champinones', 0.5, 'taza'], ['espinaca', 0.5, 'taza']),
      ing('5 s de aerosol', 'G', 1, ['aerosol', 5, 's']),
    ],
    steps: ['Armar y dorar en comal con el aerosol'],
    minutes: 10, tags: ['prep'], fridgeDays: 4, prepTasks: ['pollo', 'deshebrar'],
  },
  {
    id: 'cen-tostadas-pollo', meal: 'cena', name: 'Tostadas de pollo',
    ingredients: [
      ing('120 g de pollo', 'P', 4, ['pollo', 120, 'g']),
      ing('4 tostadas horneadas (40 g)', 'C', 2, ['tostadas', 40, 'g']),
      ing('1 taza de lechuga y jitomate', 'V', 1, ['lechuga', 0.5, 'taza'], ['jitomate', 0.5, 'taza']),
      ing('2 cdas de guacamole', 'G', 1, ['guacamole', 2, 'cda']),
    ],
    steps: ['Armar las tostadas'],
    minutes: 5, tags: ['prep'], fridgeDays: 4, prepTasks: ['pollo'],
  },
  {
    id: 'cen-sandwich', meal: 'cena', name: 'Sándwich de pavo y panela',
    ingredients: [
      ing('2 rebanadas de pan integral', 'C', 2, ['panIntegral', 2, 'rebanada']),
      ing('6 rebanadas de pavo + 1 rebanada de panela', 'P', 4, ['pavo', 6, 'rebanada'], ['panela', 1, 'rebanada']),
      ing('1 taza de lechuga y jitomate', 'V', 1, ['lechuga', 0.5, 'taza'], ['jitomate', 0.5, 'taza']),
      ing('1 cdita de mayonesa', 'G', 1, ['mayonesa', 1, 'cdita']),
    ],
    steps: ['Armar', 'Opcional: tostarlo en sartén sin grasa'],
    minutes: 5, tags: ['fresco'], fridgeDays: null, prepTasks: [],
  },
  {
    id: 'cen-salmon-papa', meal: 'cena', name: 'Salmón con papa',
    ingredients: [
      ing('120 g de salmón', 'P', 4, ['salmon', 120, 'g']),
      ing('1 papa mediana cocida', 'C', 2, ['papa', 1, 'pza']),
      ing('1 taza de espárragos o brócoli', 'V', 1, ['esparragos', 1, 'taza']),
      ing('5 s de aerosol', 'G', 1, ['aerosol', 5, 's']),
    ],
    steps: ['Salmón a la plancha o al horno a 200 °C por 12 min'],
    minutes: 20, tags: ['fresco'], fridgeDays: 2, prepTasks: [],
  },
]

export const RECIPE_BY_ID: ReadonlyMap<string, Recipe> = new Map(RECIPES.map((r) => [r.id, r]))

export function getRecipe(id: string): Recipe {
  const r = RECIPE_BY_ID.get(id)
  if (!r) throw new Error(`Unknown recipe: ${id}`)
  return r
}

export const recipesForMeal = (meal: Recipe['meal']) => RECIPES.filter((r) => r.meal === meal)

export const isFreezable = (r: Recipe) => r.tags.includes('cong')

export const TAG_LABELS: Record<RecipeTag, string> = { prep: 'Meal prep', cong: 'Congelable', fresco: 'Fresco' }
