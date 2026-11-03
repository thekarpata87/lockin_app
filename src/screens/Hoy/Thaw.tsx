import { useLiveQuery } from 'dexie-react-hooks'
import { ChecklistRow } from '../../components/ChecklistRow'
import { SectionLabel } from '../../components/SectionLabel'
import { MEALS } from '../../data/foods'
import { STORAGE_RULES } from '../../data/rules'
import { MEAL_TIMES } from '../../data/schedule'
import { setHabit } from '../../db/repo/dailyLogs'
import { getWeeklyPlan } from '../../db/repo/weeklyPlans'
import type { DailyLog } from '../../db/schema'
import { addDays, dayKeyOf, weekStartOf } from '../../lib/dates'
import { thawTonight } from '../../lib/prep'
import styles from './Hoy.module.css'

const DAY_NAME = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo' } as const

/** After dinner: move tomorrow's freezer container to the fridge (CONTENT §6). */
export function Thaw({ date, time, log }: { date: string; time: string; log: DailyLog | undefined }) {
  const tomorrow = addDays(date, 1)
  const ws = weekStartOf(tomorrow)
  const plan = useLiveQuery(() => getWeeklyPlan(ws), [ws])
  if (time < MEAL_TIMES.cena) return null
  const list = thawTonight(plan?.plan, dayKeyOf(tomorrow))
  if (!list.length) return null
  const day = DAY_NAME[dayKeyOf(tomorrow)]
  return (
    <section aria-label="Esta noche" className="anim-rise">
      <div className={styles.sectionHead}>
        <SectionLabel>Esta noche</SectionLabel>
      </div>
      <ChecklistRow
        label="Pasa al refri el contenedor de mañana"
        detail={list.map((c) => `${day} · ${MEALS[c.meal].name} · ${c.name}`).join(' — ')}
        checked={!!log?.habits.thaw}
        onChange={(v) => void setHabit(date, 'thaw', v)}
      />
      <p className={styles.missing}>{STORAGE_RULES.reheat}</p>
    </section>
  )
}
