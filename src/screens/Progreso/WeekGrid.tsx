import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SectionLabel } from '../../components/SectionLabel'
import { Segmented } from '../../components/Segmented'
import { Slide } from '../../components/Slide'
import { MEALS } from '../../data/foods'
import { MEAL_ORDER } from '../../data/types'
import { listCardio } from '../../db/repo/cardio'
import { listDailyLogs } from '../../db/repo/dailyLogs'
import { listSessions } from '../../db/repo/workouts'
import { addDays, fromISODate, weekStartOf } from '../../lib/dates'
import { weekGrid } from '../../lib/progress'
import { formatLiters } from '../../lib/today'
import styles from './Progreso.module.css'

const COLS = [
  { key: 'gym', label: 'Gym' },
  { key: 'postCardio', label: 'Post' },
  { key: 'homeCardio', label: 'Casa' },
  { key: 'sleepOnTime', label: 'Sueño' },
] as const

/** The week at a glance: meals, water, gym, cardio and sleep per day. */
export function WeekGrid({ date }: { date: string }) {
  const [which, setWhich] = useState<0 | -1>(0)
  const ws = addDays(weekStartOf(date), which * 7)
  const we = addDays(ws, 6)
  const data = useLiveQuery(async () => {
    const [logs, sessions, cardio] = await Promise.all([listDailyLogs(ws, we), listSessions(ws, we), listCardio(ws, we)])
    return weekGrid(ws, date, logs, sessions, cardio)
  }, [ws, we, date])

  return (
    <section aria-label="Semana a la vista">
      <div className={styles.sectionHead}>
        <SectionLabel>Semana a la vista</SectionLabel>
      </div>
      <Segmented
        label="Semana"
        options={[
          { value: -1, label: 'Anterior' },
          { value: 0, label: 'Esta semana' },
        ]}
        value={which}
        onChange={(v) => setWhich(v as 0 | -1)}
      />
      <Slide id={ws} pos={which}>
        <div className={styles.grid} role="table" aria-label={`Semana del ${format(fromISODate(ws), 'd MMM', { locale: es })}`}>
          <div className={`${styles.gridRow} ${styles.gridHead}`} role="row">
            <span role="columnheader">Día</span>
            <span role="columnheader">Comidas</span>
            <span role="columnheader">Agua</span>
            {COLS.map((c) => (
              <span key={c.key} role="columnheader" className={styles.center}>
                {c.label}
              </span>
            ))}
          </div>
          {(data ?? []).map((d) => {
            const dayName = format(fromISODate(d.date), 'EEE d', { locale: es }).replace('.', '')
            const mealsDone = MEAL_ORDER.filter((m) => d.meals[m]).length
            return (
              <div key={d.date} role="row" className={`${styles.gridRow} ${d.future ? styles.future : ''} ${d.date === date ? styles.today : ''}`}>
                <span role="cell" className={styles.gridDay}>
                  {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                </span>
                <span role="cell" className={styles.mealCells} aria-label={`${mealsDone} de 5 comidas`}>
                  {MEAL_ORDER.map((m) => (
                    <span key={m} title={MEALS[m].name} className={`${styles.cell} ${d.meals[m] ? styles.cellOn : ''}`} />
                  ))}
                </span>
                <span role="cell" className={styles.water}>
                  {d.future ? '' : formatLiters(d.waterMl)}
                </span>
                {COLS.map((c) => (
                  <span key={c.key} role="cell" className={styles.center} aria-label={`${c.label}: ${d[c.key] ? 'sí' : 'no'}`}>
                    <span className={`${styles.cell} ${d[c.key] ? styles.cellOn : ''}`} />
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </Slide>
    </section>
  )
}
