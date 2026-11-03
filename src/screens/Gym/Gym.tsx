import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '../../components/Button'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { Segmented } from '../../components/Segmented'
import { GYM_DAY_BY_KEY, GYM_DAYS, GYM_RULES } from '../../data/routines'
import type { GymDayKey } from '../../data/routines'
import { getSettings } from '../../db/repo/settings'
import { lastSetsForExercise, sessionsOn, setsForSession, startSession } from '../../db/repo/workouts'
import { useClock } from '../../hooks/useClock'
import { unlockAudio } from '../../lib/audio'
import { dayKeyOf } from '../../lib/dates'
import { completedSeries, targetSets } from '../../lib/gym'
import { holdWakeLock, WAKE_LOCK_HINT, wakeLockSupported } from '../../lib/wakelock'
import { ExerciseList } from './ExerciseList'
import { FinishSheet } from './FinishSheet'
import { SessionSummary } from './SessionSummary'
import { SetLogger } from './SetLogger'
import styles from './Gym.module.css'

const DAY_OPTIONS = GYM_DAYS.map((d) => ({ value: d.key, label: d.dayName.slice(0, 3) }))
const isGymDay = (k: string): k is GymDayKey => GYM_DAY_BY_KEY.has(k as GymDayKey)

export function Gym() {
  const { date } = useClock()
  const todayKey = dayKeyOf(date)
  const settings = useLiveQuery(getSettings)
  const sessions = useLiveQuery(() => sessionsOn(date), [date])
  const active = sessions?.find((s) => !s.endedAt)
  const finished = sessions?.filter((s) => s.endedAt).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0]

  const [picked, setPicked] = useState<GymDayKey>(isGymDay(todayKey) ? todayKey : 'lun')
  const dayKey = active?.dayKey ?? picked
  const day = GYM_DAY_BY_KEY.get(dayKey)!
  const reduced = settings?.reducedVolume ?? false

  const sets = useLiveQuery(() => (active ? setsForSession(active.id) : Promise.resolve([])), [active?.id]) ?? []
  const lastByExercise =
    useLiveQuery(
      async () => {
        const entries = await Promise.all(day.exercises.map(async (e) => [e.id, await lastSetsForExercise(e.id, active?.id)] as const))
        return new Map(entries)
      },
      [dayKey, active?.id],
    ) ?? new Map()

  // Current exercise: the user's pick, else the first one not finished.
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => setSelected(null), [active?.id, dayKey])
  const firstOpen = day.exercises.find((e) => completedSeries(e, sets) < targetSets(e, reduced))
  const current = day.exercises.find((e) => e.id === selected) ?? firstOpen
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (!active) return
    return holdWakeLock()
  }, [active])

  if (!settings || !sessions) return <ScreenHeader title="GYM" />

  const start = async () => {
    unlockAudio()
    await startSession(date, dayKey)
  }

  return (
    <>
      <ScreenHeader title={day.title} kicker={day.dayName} />
      {!active ? (
        <Segmented label="Día de la rutina" options={DAY_OPTIONS} value={picked} onChange={setPicked} />
      ) : null}

      {finished && !active ? <SessionSummary session={finished} /> : null}

      {!active && !isGymDay(todayKey) ? (
        <p className={styles.note}>Hoy no hay gym. Si quieres entrenar, elige el día de la rutina.</p>
      ) : null}

      {active && current ? (
        <SetLogger
          key={`${active.id}:${current.id}`}
          session={active}
          exercise={current}
          position={day.exercises.indexOf(current) + 1}
          count={day.exercises.length}
          sets={sets}
          last={lastByExercise.get(current.id) ?? []}
          reduced={reduced}
          restSec={settings.restSec}
          onDone={() => setSelected(null)}
        />
      ) : null}

      {active && !current ? (
        <section className={styles.block}>
          <SectionLabel>Rutina completa</SectionLabel>
          <p className={styles.muted}>Terminaste todos los ejercicios. Cierra la sesión y registra tu cardio post-gym.</p>
        </section>
      ) : null}

      <ExerciseList
        exercises={day.exercises}
        sets={sets}
        last={lastByExercise}
        reduced={reduced}
        currentId={active ? current?.id : undefined}
        onSelect={active ? setSelected : undefined}
      />

      <div className={styles.actions}>
        {active ? (
          <Button variant="secondary" block onClick={() => setFinishing(true)}>
            Terminar sesión
          </Button>
        ) : (
          <Button block onClick={() => void start()}>
            Iniciar sesión
          </Button>
        )}
      </div>

      {active && !wakeLockSupported() ? <p className={styles.note}>{WAKE_LOCK_HINT}</p> : null}

      {!active ? (
        <section className={styles.block}>
          <SectionLabel>Reglas</SectionLabel>
          <ul className={styles.rules}>
            {GYM_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {active ? <FinishSheet open={finishing} onClose={() => setFinishing(false)} session={active} sets={sets} date={date} /> : null}
    </>
  )
}
