import { ChecklistRow } from '../../components/ChecklistRow'
import { SectionLabel } from '../../components/SectionLabel'
import { toggleShoppingItem } from '../../db/repo/weeklyPlans'
import { plannedMeals } from '../../lib/plan'
import { PRE_SHOPPING_NOTE, shoppingList } from '../../lib/shopping'
import { useWeekPlan } from './week'
import { WeekToggle } from './WeekToggle'
import styles from './Comida.module.css'

export function Super() {
  const { plan, checked, weekStart } = useWeekPlan()
  const empty = plannedMeals(plan).length === 0
  const groups = shoppingList(plan)
  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const done = groups.reduce((n, g) => n + g.items.filter((i) => checked.includes(i.id)).length, 0)

  return (
    <>
      <WeekToggle />
      {empty ? (
        <p className={styles.empty}>Aún no hay recetas en esta semana. Elige y distribuye recetas en Semana para armar la lista.</p>
      ) : (
        <>
          <div className={styles.listHead}>
            <span className={styles.muted}>Lunes a sábado más desayunos y colaciones de 7 días. Cantidades en crudo.</span>
            <span className={styles.count}>
              {done}/{total}
            </span>
          </div>
          {groups.map((g) => (
            <section key={g.section} aria-label={g.title}>
              <div className={styles.sectionHead}>
                <SectionLabel>{g.title}</SectionLabel>
              </div>
              {g.items.map((i) => (
                <ChecklistRow
                  key={i.id}
                  label={`${i.qty} · ${i.name}`}
                  detail={i.detail}
                  checked={checked.includes(i.id)}
                  onChange={() => void toggleShoppingItem(weekStart, i.id)}
                />
              ))}
            </section>
          ))}
          <p className={styles.note}>{PRE_SHOPPING_NOTE} Verduras y fruta por taza: pesos aproximados.</p>
        </>
      )}
    </>
  )
}
