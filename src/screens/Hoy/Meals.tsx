import { useState } from 'react'
import { BracketFrame } from '../../components/BracketFrame'
import { Button } from '../../components/Button'
import { CheckMark } from '../../components/CheckMark'
import { MiniBlocks } from '../../components/MiniBlocks'
import { SectionLabel } from '../../components/SectionLabel'
import { Sheet } from '../../components/Sheet'
import { foodsInGroup, GROUPS, MEALS, VEG_NOTE } from '../../data/foods'
import { RECIPE_BY_ID, recipesForMeal, TAG_LABELS } from '../../data/recipes'
import type { Recipe } from '../../data/recipes'
import { MEAL_TIMES } from '../../data/schedule'
import { MEAL_ORDER } from '../../data/types'
import type { MealKey } from '../../data/types'
import { setMealFilled, setMealRecipe } from '../../db/repo/dailyLogs'
import type { DailyLog } from '../../db/schema'
import { clampFilled, fillMeal, mealGroups, mealProgress, recipeBlocks } from '../../lib/blocks'
import { recipeName, withSwaps } from '../../lib/plan'
import { isMealOverdue } from '../../lib/today'
import { shortTime } from './format'
import styles from './Hoy.module.css'

// CONTENT §3.1, as written.
export const PRE_TEXT = '1 manzana, ½ plátano, 2 mandarinas o 1 kiwi'

type Swaps = Record<string, Record<string, string>> | undefined

type Props = {
  date: string
  time: string
  currentMeal: MealKey | undefined
  swaps: Swaps
  log: DailyLog | undefined
  recipeFor: (m: MealKey) => string | null
  plannedFor: (m: MealKey) => string | null
}

type Open = { kind: 'recipe' | 'choose' | 'equiv'; meal: MealKey } | null

export const isMealDone = (log: DailyLog | undefined, meal: MealKey) =>
  mealProgress(meal, clampFilled(meal, log?.meals[meal]?.filled ?? {})).complete

export const toggleMeal = (date: string, meal: MealKey, done: boolean) => setMealFilled(date, meal, done ? {} : fillMeal(meal))

export function mealSubtitle(meal: MealKey, recipeId: string | null, swaps?: Swaps) {
  if (meal === 'pre') return '1 fruta + creatina'
  return recipeName(recipeId, swaps ? { picks: { desayuno: [], colacion: [], comida: [], cena: [] }, days: {}, swaps } : undefined) ?? 'Armar con bloques'
}

export function Meals({ date, time, currentMeal, swaps, log, recipeFor, plannedFor }: Props) {
  const [open, setOpen] = useState<Open>(null)
  const close = () => setOpen(null)

  return (
    <>
      <div className={styles.sectionHead}>
        <SectionLabel>Comidas de hoy</SectionLabel>
      </div>
      {MEAL_ORDER.map((meal) => {
        const done = isMealDone(log, meal)
        const recipe = RECIPE_BY_ID.get(recipeFor(meal) ?? '')
        const overdue = isMealOverdue(MEAL_TIMES[meal], time, done)
        return (
          <div key={meal} id={`meal-${meal}`} className={`${styles.mealRow} ${done ? styles.mealDone : ''}`}>
            {meal === currentMeal && !done ? <BracketFrame active inset={4} /> : null}
            <button
              type="button"
              className={styles.mealText}
              onClick={() => setOpen({ kind: recipe ? 'recipe' : 'equiv', meal })}
              aria-label={`${MEALS[meal].name}, ${mealSubtitle(meal, recipeFor(meal), swaps)}. Ver detalle`}
            >
              <span className={styles.mealTime}>{shortTime(MEAL_TIMES[meal])}</span>
              <span className={styles.mealBody}>
                <span className={styles.mealName}>
                  {MEALS[meal].name}
                  {overdue ? <span className={styles.pending}>Pendiente</span> : null}
                </span>
                <span className={styles.mealSub}>{mealSubtitle(meal, recipeFor(meal), swaps)}</span>
              </span>
            </button>
            <button
              type="button"
              role="checkbox"
              aria-checked={done}
              aria-label={`${MEALS[meal].name} hecha`}
              className={`${styles.box} fill-box ${done ? `${styles.boxOn} is-on` : ''}`}
              onClick={() => void toggleMeal(date, meal, done)}
            >
              {done ? <CheckMark size={22} /> : null}
            </button>
          </div>
        )
      })}

      <Sheet title={open ? sheetTitle(open, recipeFor, swaps) : ''} open={open !== null} onClose={close}>
        {open?.kind === 'recipe' ? (
          <RecipeView recipe={swapped(recipeFor(open.meal), swaps)} onChange={() => setOpen({ kind: 'choose', meal: open.meal })} />
        ) : null}
        {open?.kind === 'equiv' ? (
          <Equivalents meal={open.meal} onChoose={open.meal === 'pre' ? undefined : () => setOpen({ kind: 'choose', meal: open.meal })} />
        ) : null}
        {open?.kind === 'choose' ? (
          <ChooseRecipe
            meal={open.meal}
            current={recipeFor(open.meal)}
            planned={plannedFor(open.meal)}
            overridden={log?.meals[open.meal]?.recipeId !== undefined}
            onPick={(id) => {
              void setMealRecipe(date, open.meal, id)
              close()
            }}
          />
        ) : null}
      </Sheet>
    </>
  )
}

function swapped(id: string | null, swaps: Swaps): Recipe | undefined {
  const r = RECIPE_BY_ID.get(id ?? '')
  return r ? withSwaps(r, swaps?.[r.id]) : undefined
}

function sheetTitle(o: NonNullable<Open>, recipeFor: (m: MealKey) => string | null, swaps: Swaps) {
  if (o.kind === 'recipe') return swapped(recipeFor(o.meal), swaps)?.name ?? 'Receta'
  if (o.kind === 'equiv') return `Equivalentes · ${MEALS[o.meal].name}`
  return `Receta de ${MEALS[o.meal].name.toLowerCase()}`
}

function RecipeView({ recipe, onChange }: { recipe: Recipe | undefined; onChange: () => void }) {
  if (!recipe) return null
  return (
    <div className={styles.sheetBody}>
      <MiniBlocks blocks={recipeBlocks(recipe)} />
      <p className={styles.meta}>
        {recipe.minutes} min · {recipe.tags.map((t) => TAG_LABELS[t]).join(' · ')}
        {recipe.fridgeDays ? ` · ${recipe.fridgeDays} días en refri` : ''}
      </p>
      <SectionLabel as="h3">Ingredientes por porción</SectionLabel>
      <ul className={styles.ingredients}>
        {recipe.ingredients.map((i) => (
          <li key={i.text}>
            <span>{i.text}</span>
            {i.group ? (
              <span className={styles.ingBlocks}>
                {i.group}
                {i.blocks}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <SectionLabel as="h3">Pasos</SectionLabel>
      <ol className={styles.steps}>
        {recipe.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <div className={styles.formActions}>
        <Button variant="secondary" block onClick={onChange}>
          Cambiar receta
        </Button>
      </div>
    </div>
  )
}

function Equivalents({ meal, onChoose }: { meal: MealKey; onChoose?: () => void }) {
  return (
    <div className={styles.sheetBody}>
      <p className={styles.meta}>{meal === 'pre' ? `Opciones: ${PRE_TEXT}.` : 'Elige alimentos de cada grupo hasta completar sus bloques.'}</p>
      {mealGroups(meal).map((g) => (
        <div key={g} className={styles.equivGroup}>
          <SectionLabel as="h3">
            {GROUPS[g].name} ×{MEALS[meal].blocks[g]}
          </SectionLabel>
          <ul className={styles.equivList}>
            {foodsInGroup(g).map((f) => (
              <li key={f.id}>
                <span>{f.name}</span>
                <span className={styles.portion}>{f.portion}</span>
              </li>
            ))}
          </ul>
          {g === 'V' ? <p className={styles.note}>{VEG_NOTE}</p> : null}
        </div>
      ))}
      {onChoose ? (
        <div className={styles.formActions}>
          <Button variant="secondary" block onClick={onChoose}>
            Elegir una receta
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ChooseRecipe({
  meal,
  current,
  planned,
  overridden,
  onPick,
}: {
  meal: MealKey
  current: string | null
  planned: string | null
  overridden: boolean
  onPick: (id: string | null | undefined) => void
}) {
  if (meal === 'pre') return null
  const plannedName = planned ? RECIPE_BY_ID.get(planned)?.name : undefined
  return (
    <div>
      {overridden && plannedName ? (
        <button type="button" className={styles.option} onClick={() => onPick(undefined)}>
          <span className={styles.optionText}>
            <span>Volver al plan de la semana</span>
            <span className={styles.portion}>{plannedName}</span>
          </span>
        </button>
      ) : null}
      {recipesForMeal(meal).map((r) => (
        <button key={r.id} type="button" className={styles.option} onClick={() => onPick(r.id)} aria-pressed={current === r.id}>
          <span className={styles.optionText}>
            <span>{r.name}</span>
            <span className={styles.portion}>
              {r.minutes} min · {r.tags.map((t) => TAG_LABELS[t]).join(' · ')}
              {r.id === planned ? ' · En el plan' : ''}
            </span>
          </span>
          <span className={styles.optionMark}>{current === r.id ? <CheckMark /> : null}</span>
        </button>
      ))}
      <button type="button" className={styles.option} onClick={() => onPick(null)} aria-pressed={current === null}>
        <span className={styles.optionText}>
          <span>Armar con bloques</span>
          <span className={styles.portion}>Sin receta; elige equivalentes</span>
        </span>
        <span className={styles.optionMark}>{current === null ? <CheckMark /> : null}</span>
      </button>
    </div>
  )
}
