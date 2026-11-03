import { useLiveQuery } from 'dexie-react-hooks'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { FOODS } from '../../data/foods'
import { RECIPES } from '../../data/recipes'
import { GYM_DAYS } from '../../data/routines'
import { getBodyMetric } from '../../db/repo/bodyMetrics'
import { getSettings } from '../../db/repo/settings'
import { recipeFitsMeal } from '../../lib/blocks'
import { planDay, today } from '../../lib/dates'
import styles from './Hoy.module.css'

const MEAL_COUNTS = (['desayuno', 'colacion', 'comida', 'cena'] as const).map((m) => RECIPES.filter((r) => r.meal === m).length)
const EXERCISES = GYM_DAYS.reduce((n, d) => n + d.exercises.length, 0)
const ALL_FIT = RECIPES.every(recipeFitsMeal)

/** M2: plan day and today's weight come from Dexie. Meals, water and habits arrive in M3. */
export function Hoy() {
  const date = today()
  const settings = useLiveQuery(getSettings)
  const metric = useLiveQuery(() => getBodyMetric(date), [date])
  const day = settings?.startDate ? planDay(settings.startDate, date) : null

  return (
    <>
      <ScreenHeader title="HOY" />
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.number}>{day === null ? '—' : String(day).padStart(3, '0')}</span>
          <span className={styles.label}>Día del plan</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.number}>{metric?.weightKg?.toFixed(1) ?? '—'}</span>
          <span className={styles.label}>kg hoy</span>
        </div>
      </div>
      <section className={styles.row}>
        <SectionLabel>Contenido cargado</SectionLabel>
        <ul className={styles.list}>
          <li>{RECIPES.length} recetas: {MEAL_COUNTS[0]} desayunos, {MEAL_COUNTS[1]} colaciones, {MEAL_COUNTS[2]} comidas y {MEAL_COUNTS[3]} cenas</li>
          <li>{ALL_FIT ? 'Todas las recetas suman los bloques de su tiempo' : 'Hay recetas que no suman sus bloques'}</li>
          <li>{FOODS.length} alimentos equivalentes</li>
          <li>{GYM_DAYS.length} días de gym, {EXERCISES} ejercicios</li>
        </ul>
      </section>
      <section className={styles.row}>
        <SectionLabel>En construcción</SectionLabel>
        <p className={styles.muted}>Las comidas, el agua y los hábitos llegan en el hito M3.</p>
      </section>
      <p className={styles.version}>Versión {__APP_VERSION__}</p>
    </>
  )
}
