import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { ChecklistRow } from '../../components/ChecklistRow'
import { SectionLabel } from '../../components/SectionLabel'
import { Slide } from '../../components/Slide'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { MEALS } from '../../data/foods'
import { RECIPE_BY_ID, recipesForMeal, TAG_LABELS } from '../../data/recipes'
import { STORAGE_RULES } from '../../data/rules'
import { DAY_ORDER } from '../../data/types'
import type { DayKey } from '../../data/types'
import { autoPlan, needsFreshWarning, PICK_LIMITS, PLAN_DAYS, recipeName, setDayRecipe, togglePick } from '../../lib/plan'
import type { PlanMeal } from '../../lib/plan'
import { useWeekChoice, useWeekPlan } from './week'
import { WeekToggle } from './WeekToggle'
import styles from './Comida.module.css'

const DAY_NAME: Record<DayKey, string> = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo' }
const PICK_ORDER: PlanMeal[] = ['comida', 'cena', 'desayuno', 'colacion']
const PLURAL: Record<PlanMeal, string> = { comida: 'comidas', cena: 'cenas', desayuno: 'desayunos', colacion: 'colaciones' }

export function Semana() {
  const toast = useToast()
  const { plan, save } = useWeekPlan()
  const choice = useWeekChoice()
  const [picking, setPicking] = useState<PlanMeal | null>(null)
  const [editing, setEditing] = useState<{ day: DayKey; meal: PlanMeal } | null>(null)

  const hasPicks = plan.picks.comida.length > 0 || plan.picks.cena.length > 0
  const hasDays = Object.values(plan.days).some((d) => d && Object.keys(d).length)

  return (
    <>
      <WeekToggle />
      <Slide id={choice} pos={choice === 'this' ? 0 : 1}>
      <div className={styles.sectionHead}>
        <SectionLabel>Recetas de la semana</SectionLabel>
      </div>
      {PICK_ORDER.map((meal) => {
        const picks = plan.picks[meal]
        const lim = PICK_LIMITS[meal]
        return (
          <button key={meal} type="button" className={styles.pickRow} onClick={() => setPicking(meal)}>
            <span className={styles.pickText}>
              <span>
                {MEALS[meal].name} <span className={styles.muted}>· elige {lim.min} a {lim.max}</span>
              </span>
              <span className={styles.muted}>{picks.length ? picks.map((id) => recipeName(id, plan)).join(' · ') : 'Sin elegir'}</span>
            </span>
            <span className={styles.count}>
              {picks.length}/{lim.max}
            </span>
          </button>
        )
      })}

      {!hasPicks ? <p className={styles.empty}>Aún no eliges recetas para esta semana. Elige 2 comidas y 2 cenas.</p> : null}

      <div className={styles.actions}>
        <Button
          block
          disabled={!hasPicks}
          onClick={() => {
            void save(autoPlan(plan))
            toast('Semana distribuida')
          }}
        >
          {hasDays ? 'Volver a distribuir' : 'Distribuir la semana'}
        </Button>
      </div>

      {hasDays
        ? DAY_ORDER.map((day) => (
            <section key={day} className={styles.day} aria-label={DAY_NAME[day]}>
              <div className={styles.dayHead}>
                <SectionLabel as="h3">{DAY_NAME[day]}</SectionLabel>
                {day === 'dom' ? <span className={styles.muted}>Preparación · comida flexible sugerida</span> : null}
              </div>
              {(['desayuno', 'colacion', 'comida', 'cena'] as PlanMeal[])
                .filter((m) => PLAN_DAYS[m].includes(day))
                .map((meal) => {
                  const id = plan.days[day]?.[meal]
                  const r = id ? RECIPE_BY_ID.get(id) : undefined
                  return (
                    <button key={meal} type="button" className={styles.slot} onClick={() => setEditing({ day, meal })}>
                      <span className={styles.slotMeal}>{MEALS[meal].name}</span>
                      <span className={styles.slotText}>
                        <span>{r ? recipeName(r.id, plan) : 'Sin receta'}</span>
                        {needsFreshWarning(day, meal, id) ? <span className={styles.warnText}>{STORAGE_RULES.freshWarning}</span> : null}
                      </span>
                    </button>
                  )
                })}
              {day === 'dom' ? <p className={styles.note}>Comida y cena del domingo se cocinan frescas.</p> : null}
            </section>
          ))
        : null}
      </Slide>

      <Sheet title={picking ? `Elige ${PLURAL[picking]}` : ''} open={picking !== null} onClose={() => setPicking(null)}>
        {picking ? (
          <>
            <p className={styles.sheetNote}>
              Elige de {PICK_LIMITS[picking].min} a {PICK_LIMITS[picking].max}. Se alternan sin repetir dos días seguidos.
            </p>
            {recipesForMeal(picking).map((r) => {
              const on = plan.picks[picking].includes(r.id)
              const full = !on && plan.picks[picking].length >= PICK_LIMITS[picking].max
              return (
                <ChecklistRow
                  key={r.id}
                  label={recipeName(r.id, plan) ?? r.name}
                  detail={`${r.minutes} min · ${r.tags.map((t) => TAG_LABELS[t]).join(' · ')}${full ? ' · quita una para elegir esta' : ''}`}
                  checked={on}
                  onChange={() => {
                    if (full) return
                    void save(togglePick(plan, picking, r.id))
                  }}
                />
              )
            })}
            <div className={styles.actions}>
              <Button variant="secondary" block onClick={() => setPicking(null)}>
                Listo
              </Button>
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet
        title={editing ? `${DAY_NAME[editing.day]} · ${MEALS[editing.meal].name}` : ''}
        open={editing !== null}
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <>
            {[...plan.picks[editing.meal], ...recipesForMeal(editing.meal).map((r) => r.id).filter((id) => !plan.picks[editing.meal].includes(id))].map((id) => {
              const r = RECIPE_BY_ID.get(id)!
              const current = plan.days[editing.day]?.[editing.meal] === id
              return (
                <ChecklistRow
                  key={id}
                  label={recipeName(id, plan) ?? r.name}
                  detail={`${plan.picks[editing.meal].includes(id) ? 'Elegida para la semana · ' : ''}${r.tags.map((t) => TAG_LABELS[t]).join(' · ')}${
                    needsFreshWarning(editing.day, editing.meal, id) ? ' · conviene fresca' : ''
                  }`}
                  checked={current}
                  onChange={() => {
                    void save(setDayRecipe(plan, editing.day, editing.meal, id))
                    setEditing(null)
                  }}
                />
              )
            })}
            <div className={styles.actions}>
              {plan.days[editing.day]?.[editing.meal] ? (
                <Link className={styles.linkBtn} to={`/comida/receta/${plan.days[editing.day]?.[editing.meal]}`}>
                  Ver receta
                </Link>
              ) : null}
              <Button
                variant="ghost"
                onClick={() => {
                  void save(setDayRecipe(plan, editing.day, editing.meal, undefined))
                  setEditing(null)
                }}
              >
                Dejar sin receta
              </Button>
            </div>
          </>
        ) : null}
      </Sheet>
    </>
  )
}
