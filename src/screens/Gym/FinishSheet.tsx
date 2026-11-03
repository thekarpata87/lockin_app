import { useState } from 'react'
import { Button } from '../../components/Button'
import { ChecklistRow } from '../../components/ChecklistRow'
import { Sheet } from '../../components/Sheet'
import { Stepper } from '../../components/Stepper'
import { useToast } from '../../components/Toast'
import { saveCardioSession } from '../../db/repo/cardio'
import { setHabit } from '../../db/repo/dailyLogs'
import { endSession } from '../../db/repo/workouts'
import { softDelete } from '../../db/write'
import { db } from '../../db/schema'
import type { SetLog, WorkoutSession } from '../../db/schema'
import { sessionSummary } from '../../lib/gym'
import { stopRest } from './rest'
import styles from './Gym.module.css'

type Props = { open: boolean; onClose: () => void; session: WorkoutSession; sets: SetLog[]; date: string }

export function FinishSheet({ open, onClose, session, sets, date }: Props) {
  const toast = useToast()
  const [cardio, setCardio] = useState(false)
  const [minutes, setMinutes] = useState(20)
  const s = sessionSummary(sets, session.startedAt, Date.now())

  const finish = async () => {
    await endSession(session.id, cardio ? minutes : undefined)
    await setHabit(date, 'gym', true)
    if (cardio) {
      await setHabit(date, 'gymCardio', true)
      await saveCardioSession({ date, kind: 'post', minutes, completed: true })
    }
    stopRest()
    onClose()
    toast('Sesión terminada')
  }

  const discard = async () => {
    await softDelete(db.workoutSessions, session.id)
    stopRest()
    onClose()
    toast('Sesión descartada')
  }

  return (
    <Sheet title="Terminar sesión" open={open} onClose={onClose}>
      <div className={`${styles.summaryGrid} ${styles.three}`}>
        <Stat value={String(s.minutes)} label="min" />
        <Stat value={String(s.series)} label="series" />
        <Stat value={s.volumeKg.toLocaleString('es-MX')} label="kg de volumen" />
      </div>
      <ChecklistRow label="Ya hice el cardio post-gym" detail="Si aún no, inícialo con temporizador al terminar" checked={cardio} onChange={setCardio} />
      {cardio ? <Stepper label="Minutos de cardio" value={minutes} onChange={setMinutes} step={1} min={1} max={90} decimals={0} unit="min" inputMode="numeric" /> : null}
      <div className={styles.sheetPad}>
        <Button block onClick={() => void finish()}>
          Guardar y terminar
        </Button>
        {sets.length === 0 ? (
          <Button variant="ghost" onClick={() => void discard()}>
            Descartar sesión sin series
          </Button>
        ) : null}
      </div>
    </Sheet>
  )
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.sumStat}>
      <span className={styles.sumValue}>{value}</span>
      <span className={styles.muted}>{label}</span>
    </div>
  )
}
