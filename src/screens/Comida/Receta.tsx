import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/Button'
import { CardTabs } from '../../components/CardTab'
import { CheckMark } from '../../components/CheckMark'
import { MiniBlocks } from '../../components/MiniBlocks'
import { SectionLabel } from '../../components/SectionLabel'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { foodsInGroup, getFood, MEALS, PROTEIN_NOTE } from '../../data/foods'
import { RECIPE_BY_ID, recipesForMeal, TAG_LABELS } from '../../data/recipes'
import { setMealRecipe } from '../../db/repo/dailyLogs'
import { amountForBlocks, itemBlocks, recipeBlocks } from '../../lib/blocks'
import { today } from '../../lib/dates'
import { isInWeek, PICK_LIMITS, setSwap, toggleInWeek, withSwaps } from '../../lib/plan'
import { useWeekChoice, useWeekPlan, weekRangeLabel } from './week'
import styles from './Comida.module.css'

const fmt = (n: number) => String(Number(n.toFixed(2)))

export function Receta() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { plan, save, weekStart } = useWeekPlan()
  const choice = useWeekChoice()
  const [swapping, setSwapping] = useState(false)
  const base = RECIPE_BY_ID.get(id)
  if (!base) return <p className={styles.empty}>No encontré esa receta.</p>

  const swaps = plan.swaps?.[id]
  const recipe = withSwaps(base, swaps)
  const inWeek = isInWeek(plan, id)
  const full = plan.picks[recipe.meal].length >= PICK_LIMITS[recipe.meal].max
  const proteinItems = base.ingredients.flatMap((i) => (i.group === 'P' ? (i.items ?? []) : []))
  const weekLabel = `${choice === 'this' ? 'esta semana' : 'la próxima semana'} (${weekRangeLabel(weekStart)})`

  const storage = [
    recipe.fridgeDays ? `${recipe.fridgeDays} ${recipe.fridgeDays === 1 ? 'día' : 'días'} en refri` : 'Mejor al momento',
    recipe.tags.includes('cong') ? 'congelable' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <div className={styles.backRow}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <span className={styles.muted}>{MEALS[recipe.meal].name}</span>
      </div>
      <section className={styles.recipeHead}>
        <CardTabs tags={recipe.tags.map((t) => TAG_LABELS[t])} />
        <div className={styles.recipeHeadBody}>
          <h2 className={styles.recipeTitle}>{recipe.name}</h2>
          {recipe.name !== base.name ? <p className={styles.muted}>Original: {base.name}</p> : null}
          {isInWeek(plan, id) ? (
            <p className={styles.inWeek}>
              <CheckMark size={16} /> En {choice === 'this' ? 'esta semana' : 'la próxima semana'}
            </p>
          ) : null}
          <MiniBlocks blocks={recipeBlocks(recipe)} />
          <p className={styles.muted}>
            {recipe.minutes} min · {storage}
          </p>
        </div>
      </section>

      <div className={styles.sectionHead}>
        <SectionLabel>Ingredientes por porción</SectionLabel>
      </div>
      <ul className={styles.ingList}>
        {recipe.ingredients.map((i) => (
          <li key={i.text} className={styles.ingRow}>
            <span>{i.text}</span>
            {i.group ? (
              <span className={styles.muted}>
                {i.group}
                {i.blocks}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className={styles.note}>Pesos cocidos o servidos. {swaps ? `Proteína cambiada para ${weekLabel}.` : ''}</p>

      <div className={styles.sectionHead}>
        <SectionLabel>Pasos</SectionLabel>
      </div>
      <ol className={styles.stepList}>
        {recipe.steps.map((s, i) => (
          <li key={s} className={styles.stepRow}>
            <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <div className={styles.actionsCol}>
        <Button
          block
          onClick={() => {
            void setMealRecipe(today(), recipe.meal, id)
            toast(`Usarás esta receta hoy en ${MEALS[recipe.meal].name.toLowerCase()}`)
          }}
        >
          Usar hoy en {MEALS[recipe.meal].name.toLowerCase()}
        </Button>
        <Button
          variant="secondary"
          block
          disabled={!inWeek && full}
          onClick={() => {
            void save(toggleInWeek(plan, recipe.meal, id))
            toast(inWeek ? 'Quitada de la semana' : 'Agregada a la semana')
          }}
        >
          {inWeek ? 'Quitar de la semana' : !full ? 'Agregar a la semana' : 'Semana llena'}
        </Button>
        {proteinItems.length ? (
          <Button variant="secondary" block onClick={() => setSwapping(true)}>
            Cambiar proteína
          </Button>
        ) : null}
      </div>

      <div className={styles.sectionHead}>
        <SectionLabel>Alternativas</SectionLabel>
      </div>
      <ul className={styles.recipeList}>
        {recipesForMeal(recipe.meal)
          .filter((r) => r.id !== id)
          .map((r) => (
            <li key={r.id}>
              <Link to={`/comida/receta/${r.id}`} className={styles.altRow} replace>
                <span>{r.name}</span>
                <span className={styles.muted}>{r.minutes} min</span>
              </Link>
            </li>
          ))}
      </ul>

      <Sheet title="Cambiar proteína" open={swapping} onClose={() => setSwapping(false)}>
        <p className={styles.sheetNote}>
          Mismos bloques, otra proteína. Aplica a {weekLabel}, también en el súper y el domingo. {PROTEIN_NOTE}
        </p>
        {proteinItems.map((it) => {
          const blocks = itemBlocks(it)
          const current = swaps?.[it.foodId] ?? it.foodId
          return (
            <div key={it.foodId}>
              <div className={styles.sectionHead}>
                <SectionLabel as="h3">
                  {getFood(it.foodId).name} · {fmt(blocks)} bloques
                </SectionLabel>
              </div>
              {foodsInGroup('P').map((f) => {
                const a = amountForBlocks(f, blocks)
                const on = f.id === current
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={styles.option}
                    aria-pressed={on}
                    onClick={() => {
                      void save(setSwap(plan, id, it.foodId, f.id === it.foodId ? undefined : f.id))
                    }}
                  >
                    <span className={styles.optionText}>
                      <span>{f.name}</span>
                      <span className={styles.muted}>
                        {fmt(a.amount)} {a.unit}
                        {f.id === it.foodId ? ' · original' : ''}
                      </span>
                    </span>
                    <span className={styles.optionMark}>{on ? <CheckMark /> : null}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
        <div className={styles.actions}>
          <Button variant="secondary" block onClick={() => setSwapping(false)}>
            Listo
          </Button>
        </div>
      </Sheet>
    </>
  )
}

