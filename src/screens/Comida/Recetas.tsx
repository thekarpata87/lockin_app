import { useState } from 'react'
import { Link } from 'react-router'
import { CardTabs } from '../../components/CardTab'
import { MiniBlocks } from '../../components/MiniBlocks'
import { Segmented } from '../../components/Segmented'
import { MEALS } from '../../data/foods'
import { RECIPES, TAG_LABELS } from '../../data/recipes'
import type { RecipeTag } from '../../data/recipes'
import { recipeBlocks } from '../../lib/blocks'
import type { PlanMeal } from '../../lib/plan'
import styles from './Comida.module.css'

type MealFilter = 'todas' | PlanMeal
const MEAL_OPTIONS: { value: MealFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'desayuno', label: 'Desay.' },
  { value: 'colacion', label: 'Colac.' },
  { value: 'comida', label: 'Comida' },
  { value: 'cena', label: 'Cena' },
]
const TAGS: RecipeTag[] = ['prep', 'cong', 'fresco']

let lastMeal: MealFilter = 'todas'
let lastTags: RecipeTag[] = []

export function Recetas() {
  const [meal, setMealState] = useState<MealFilter>(lastMeal)
  const [tags, setTagsState] = useState<RecipeTag[]>(lastTags)
  const setMeal = (m: MealFilter) => setMealState((lastMeal = m))
  const toggleTag = (t: RecipeTag) => setTagsState((lastTags = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]))

  const list = RECIPES.filter((r) => (meal === 'todas' || r.meal === meal) && tags.every((t) => r.tags.includes(t)))

  return (
    <>
      <Segmented label="Tiempo de comida" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      <div className={styles.filters} role="group" aria-label="Filtros">
        {TAGS.map((t) => (
          <button key={t} type="button" className={`${styles.filter} ${tags.includes(t) ? styles.filterOn : ''}`} aria-pressed={tags.includes(t)} onClick={() => toggleTag(t)}>
            {TAG_LABELS[t]}
          </button>
        ))}
      </div>
      {list.length === 0 ? <p className={styles.empty}>Ninguna receta con esos filtros. Quita alguno.</p> : null}
      <ul className={styles.recipeList}>
        {list.map((r) => (
          <li key={r.id}>
            <Link to={`/comida/receta/${r.id}`} className={styles.recipeRow}>
              <CardTabs tags={r.tags.map((t) => TAG_LABELS[t])} />
              <span className={styles.recipeBody}>
                <span className={styles.recipeName}>{r.name}</span>
                <span className={styles.muted}>
                  {MEALS[r.meal].name} · {r.minutes} min
                </span>
                <MiniBlocks blocks={recipeBlocks(r)} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
