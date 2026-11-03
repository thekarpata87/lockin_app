import { useLiveQuery } from 'dexie-react-hooks'
import { SectionLabel } from '../../components/SectionLabel'
import { GYM_DAY_BY_KEY } from '../../data/routines'
import { setsForSession } from '../../db/repo/workouts'
import type { WorkoutSession } from '../../db/schema'
import { sessionSummary } from '../../lib/gym'
import { Stat } from './FinishSheet'
import styles from './Gym.module.css'

export function SessionSummary({ session }: { session: WorkoutSession }) {
  const sets = useLiveQuery(() => setsForSession(session.id), [session.id]) ?? []
  const s = sessionSummary(sets, session.startedAt, session.endedAt ?? Date.now())
  const day = GYM_DAY_BY_KEY.get(session.dayKey)
  return (
    <section aria-label="Sesión terminada">
      <div className={styles.sectionHead}>
        <SectionLabel>Sesión terminada · {day?.title.toLowerCase().replace(/^./, (c) => c.toUpperCase())}</SectionLabel>
      </div>
      <div className={styles.summaryGrid}>
        <Stat value={String(s.minutes)} label="min" />
        <Stat value={String(s.series)} label="series" />
        <Stat value={s.volumeKg.toLocaleString('es-MX')} label="kg de volumen" />
        <Stat value={session.cardioMin ? String(session.cardioMin) : '—'} label="min de cardio" />
      </div>
    </section>
  )
}
