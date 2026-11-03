import { useState } from 'react'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { CardTabs } from '../../components/CardTab'
import { CheckMark } from '../../components/CheckMark'
import { MiniBlocks } from '../../components/MiniBlocks'
import { Segmented } from '../../components/Segmented'
import { Slide } from '../../components/Slide'
import { useToast } from '../../components/Toast'
import { MEALS } from '../../data/foods'
import { RECIPES, TAG_LABELS } from '../../data/recipes'
import type { RecipeTag } from '../../data/recipes'
import { recipeBlocks } from '../../lib/blocks'
import { isInWeek, PICK_LIMITS, recipeName, toggleInWeek } from '../../lib/plan'
import type { PlanMeal } from '../../lib/plan'
import { useWeekChoice, useWeekPlan } from './week'
import styles from './Comida.module.css'

type MealFilter = 'todas' | 'semana' | PlanMeal
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
let lastOnlyWeek = false

export function Recetas() {
  const toast = useToast()
  const { plan, save } = useWeekPlan()
  const choice = useWeekChoice()
  const [meal, setMealState] = useState<MealFilter>(lastMeal)
  const [tags, setTagsState] = useState<RecipeTag[]>(lastTags)
  const [onlyWeek, setOnlyWeekState] = useState(lastOnlyWeek)
  const setMeal = (m: MealFilter) => setMealState((lastMeal = m))
  const toggleTag = (t: RecipeTag) => setTagsState((lastTags = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]))
  const toggleOnlyWeek = () => setOnlyWeekState((lastOnlyWeek = !onlyWeek))
  const weekWord = choice === 'this' ? 'esta semana' : 'la próxima semana'

  const list = RECIPES.filter(
    (r) => (meal === 'todas' || r.meal === meal) && tags.every((t) => r.tags.includes(t)) && (!onlyWeek || isInWeek(plan, r.id)),
  )

  return (
    <>
      <Segmented label="Tiempo de comida" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      <div className={styles.filters4} role="group" aria-label="Filtros">
        <button type="button" className={`${styles.filter} ${onlyWeek ? styles.filterOn : ''}`} aria-pressed={onlyWeek} onClick={toggleOnlyWeek}>
          En la semana
        </button>
        {TAGS.map((t) => (
          <button key={t} type="button" className={`${styles.filter} ${tags.includes(t) ? styles.filterOn : ''}`} aria-pressed={tags.includes(t)} onClick={() => toggleTag(t)}>
            {TAG_LABELS[t]}
          </button>
        ))}
      </div>
      <Slide id={`${meal}|${tags.join(',')}|${onlyWeek}`} pos={MEAL_OPTIONS.findIndex((o) => o.value === meal)}>
      {list.length === 0 ? (
        <p className={styles.empty}>{onlyWeek ? `Aún no agregas recetas a ${weekWord}.` : 'Ninguna receta con esos filtros. Quita alguno.'}</p>
      ) : null}
      <ul className={styles.recipeList}>
        {list.map((r) => {
          const inWeek = isInWeek(plan, r.id)
          const picked = inWeek
          const full = !picked && plan.picks[r.meal].length >= PICK_LIMITS[r.meal].max
          return (
            <li key={r.id} className={`${styles.recipeItem} ${inWeek ? styles.recipeInWeek : ''}`}>
              <Link to={`/comida/receta/${r.id}`} className={styles.recipeRow}>
                <CardTabs tags={r.tags.map((t) => TAG_LABELS[t])} />
                <span className={styles.recipeBody}>
                  <span className={styles.recipeName}>{recipeName(r.id, plan)}</span>
                  <span className={styles.muted}>
                    {MEALS[r.meal].name} · {r.minutes} min
                    {inWeek ? <span className={styles.inWeekText}> · En la semana</span> : null}
                  </span>
                  <MiniBlocks blocks={recipeBlocks(r)} />
                </span>
              </Link>
              <button
                type="button"
                className={`${styles.quickAdd} fill-box ${picked ? `${styles.quickAddOn} is-on` : ''}`}
                aria-pressed={picked}
                aria-label={picked ? `Quitar ${r.name} de ${weekWord}` : `Agregar ${r.name} a ${weekWord}`}
                onClick={() => {
                  if (full) {
                    toast(`Ya tienes ${PICK_LIMITS[r.meal].max} ${MEALS[r.meal].name.toLowerCase()}s. Quita una primero.`)
                    return
                  }
                  void save(toggleInWeek(plan, r.meal, r.id))
                  toast(picked ? 'Quitada de la semana' : 'Agregada a la semana')
                }}
              >
                {picked ? <CheckMark size={20} /> : <Plus size={20} strokeWidth={1.5} aria-hidden="true" />}
              </button>
            </li>
          )
        })}
      </ul>
      </Slide>
    </>
  )
}
