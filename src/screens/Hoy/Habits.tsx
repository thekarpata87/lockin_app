import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChecklistRow } from '../../components/ChecklistRow'
import { SectionLabel } from '../../components/SectionLabel'
import { CARDIO_BY_ID, HOME_CARDIO_WEEK, STEPS_GOAL } from '../../data/cardio'
import { GYM_DAY_BY_KEY } from '../../data/routines'
import type { GymDayKey } from '../../data/routines'
import type { DayKey } from '../../data/types'
import { EMPTY_HABITS, setFlexMeal, setHabit, setSteps } from '../../db/repo/dailyLogs'
import type { DailyLog, Habits as HabitsT } from '../../db/schema'
import { fromISODate } from '../../lib/dates'
import { HABIT_LABELS, habitsFor } from '../../lib/today'
import { shortTime } from './format'
import styles from './Hoy.module.css'

type Props = {
  date: string
  dayKey: DayKey
  log: DailyLog | undefined
  sleepTime: string
  creatineG: number
  flexOtherDay: string | undefined
}

const fmtSteps = (n: number) => n.toLocaleString('es-MX')

export function Habits({ date, dayKey, log, sleepTime, creatineG, flexOtherDay }: Props) {
  const habits = { ...EMPTY_HABITS, ...log?.habits }
  const cardio = HOME_CARDIO_WEEK[dayKey]
  const detail: Partial<Record<keyof HabitsT, string>> = {
    pre: `Creatina ${creatineG} g`,
    gym: GYM_DAY_BY_KEY.get(dayKey as GymDayKey)?.title.toLowerCase().replace(/^./, (c) => c.toUpperCase()),
    gymCardio: '20–25 min en zona 2',
    homeCardio: cardio.main ? `${CARDIO_BY_ID.get(cardio.main)?.name}${cardio.alt ? ` (o ${cardio.alt})` : ''}` : undefined,
  }
  const label = (h: keyof HabitsT) => (h === 'sleepOnTime' ? `Dormir a las ${shortTime(sleepTime)}` : HABIT_LABELS[h])

  return (
    <section aria-label="Hábitos">
      <div className={styles.sectionHead}>
        <SectionLabel>Hábitos</SectionLabel>
      </div>
      {habitsFor(dayKey).map((h) => (
        <ChecklistRow key={h} label={label(h)} detail={detail[h]} checked={habits[h]} onChange={(v) => void setHabit(date, h, v)} />
      ))}
      <StepsRow date={date} steps={log?.steps} />
      <ChecklistRow
        label="Usé mi comida flexible"
        detail={
          flexOtherDay && !log?.flexMeal
            ? `Ya la usaste el ${format(fromISODate(flexOtherDay), 'EEEE', { locale: es })}. Es una por semana.`
            : 'Una por semana, una sola comida. Sugerida el domingo.'
        }
        checked={log?.flexMeal ?? false}
        onChange={(v) => void setFlexMeal(date, v)}
      />
    </section>
  )
}

function StepsRow({ date, steps }: { date: string; steps: number | undefined }) {
  const [draft, setDraft] = useState(steps !== undefined ? String(steps) : '')
  useEffect(() => {
    setDraft(steps !== undefined ? String(steps) : '')
  }, [steps])
  const commit = () => {
    const clean = draft.replace(/[^\d]/g, '')
    const n = clean === '' ? undefined : Number(clean)
    if (n !== steps) void setSteps(date, n)
  }
  return (
    <label className={styles.stepsRow}>
      <span className={styles.stepsText}>
        <span>Pasos</span>
        <span className={styles.label}>
          Meta: {fmtSteps(STEPS_GOAL.min)} a {fmtSteps(STEPS_GOAL.max)}
        </span>
      </span>
      <input
        className={styles.stepsInput}
        type="text"
        inputMode="numeric"
        enterKeyHint="done"
        placeholder="—"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </label>
  )
}
