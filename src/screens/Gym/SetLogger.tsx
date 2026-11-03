import { useState } from 'react'
import { BracketFrame } from '../../components/BracketFrame'
import { Button } from '../../components/Button'
import { CheckMark } from '../../components/CheckMark'
import { ChecklistRow } from '../../components/ChecklistRow'
import { Segmented } from '../../components/Segmented'
import { Sheet } from '../../components/Sheet'
import { Stepper } from '../../components/Stepper'
import { useToast } from '../../components/Toast'
import { REST_OPTIONS_SEC } from '../../data/routines'
import type { Exercise } from '../../data/routines'
import { updateSettings } from '../../db/repo/settings'
import { deleteSet, saveSet } from '../../db/repo/workouts'
import type { SetLog, WorkoutSession } from '../../db/schema'
import { unlockAudio } from '../../lib/audio'
import {
  completedSeries,
  formatSets,
  logsReps,
  logsWeight,
  nextSlot,
  prefill,
  progression,
  repsLabel,
  suggestionText,
  targetSets,
  weightStep,
} from '../../lib/gym'
import type { Side } from '../../lib/gym'
import { RestBar } from './RestBar'
import { startRest, useRest } from './rest'
import styles from './Gym.module.css'

type Props = {
  session: WorkoutSession
  exercise: Exercise
  position: number
  count: number
  sets: SetLog[]
  last: SetLog[]
  reduced: boolean
  restSec: number
  onDone: () => void
}

const SIDE_LABEL: Record<Side, string> = { izq: 'Izquierda', der: 'Derecha' }
const kg = (n?: number) => (n === undefined ? '' : n.toFixed(1))

export function SetLogger({ session, exercise: e, position, count, sets, last, reduced, restSec, onDone }: Props) {
  const toast = useToast()
  const rest = useRest()
  const suggestion = progression(e, last, reduced)
  const init = prefill(e, sets, last, suggestion)
  const [weight, setWeight] = useState(init.weightKg)
  const [reps, setReps] = useState(init.reps)
  const [completed21, setCompleted21] = useState(true)
  const [sideOverride, setSideOverride] = useState<Side | null>(null)
  const [toDelete, setToDelete] = useState<SetLog | null>(null)

  const mine = sets.filter((s) => s.exerciseId === e.id)
  const done = completedSeries(e, sets)
  const target = targetSets(e, reduced)
  const slot = nextSlot(e, sets)
  const side = e.unilateral ? (sideOverride ?? slot.side ?? 'izq') : undefined
  const prev = formatSets(e, last)

  const save = async () => {
    unlockAudio()
    const is21 = e.reps.kind === '21s'
    await saveSet({
      sessionId: session.id,
      exerciseId: e.id,
      setIndex: slot.setIndex,
      ...(side ? { side } : {}),
      ...(logsWeight(e) ? { weightKg: weight } : {}),
      ...(is21 ? { reps: completed21 ? 21 : 0 } : logsReps(e) ? { reps } : {}),
      done: is21 ? completed21 : true,
    })
    setSideOverride(null)
    toast('Serie guardada')
    const firstSideOnly = e.unilateral && side === 'izq'
    if (!firstSideOnly) startRest(session.id, restSec)
    const nowDone = done + (e.unilateral ? (side === 'der' ? 1 : 0) : 1)
    if (nowDone >= target) onDone()
  }

  return (
    <section className={styles.logger} aria-label={`Registrar ${e.name}`}>
      <div className={styles.current}>
        <BracketFrame active inset={6} />
        <p className={styles.currentTitle}>
          <span className={styles.index}>
            {String(position).padStart(2, '0')}/{String(count).padStart(2, '0')}
          </span>{' '}
          {e.name}
        </p>
        <p className={styles.muted}>
          {repsLabel(e, reduced)} · descanso {restSec} s
        </p>
        <p className={styles.muted}>{prev ? `Última vez: ${prev}` : 'Primera vez con este ejercicio'}</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>SERIE</span>
          <span className={styles.statValue}>
            {done + 1} / {target}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>SUGERENCIA</span>
          <span className={styles.statText}>{suggestionText(suggestion) ?? '—'}</span>
        </div>
      </div>

      {e.unilateral ? (
        <Segmented
          label="Lado"
          options={(['izq', 'der'] as const).map((v) => ({ value: v, label: SIDE_LABEL[v] }))}
          value={side ?? 'izq'}
          onChange={setSideOverride}
        />
      ) : null}

      {logsWeight(e) ? (
        <Stepper label="Peso en kg" value={weight} onChange={setWeight} step={weightStep(e)} min={0} max={400} decimals={1} unit="kg" />
      ) : null}
      {e.reps.kind === '21s' ? (
        <ChecklistRow label="Completé 7 + 7 + 7" checked={completed21} onChange={setCompleted21} />
      ) : (
        <Stepper label="Repeticiones" value={reps} onChange={setReps} step={1} min={0} max={100} decimals={0} unit="reps" inputMode="numeric" />
      )}

      <div className={styles.saveRow}>
        <Button block onClick={() => void save()}>
          Guardar serie
        </Button>
      </div>
      {rest && rest.sessionId === session.id ? <RestBar key={rest.endAt} rest={rest} /> : null}

      <Segmented
        label="Descanso"
        options={REST_OPTIONS_SEC.map((s) => ({ value: s, label: `${s} s` }))}
        value={restSec as (typeof REST_OPTIONS_SEC)[number]}
        onChange={(v) => void updateSettings({ restSec: v })}
      />

      {mine.length ? (
        <ul className={styles.logged} aria-label="Series guardadas">
          {mine.map((s) => (
            <li key={s.id}>
              <button type="button" className={styles.loggedRow} onClick={() => setToDelete(s)} aria-label={`Serie ${s.setIndex + 1}, opciones`}>
                <span className={styles.index}>{s.setIndex + 1}</span>
                <span className={styles.loggedText}>
                  {s.side ? `${SIDE_LABEL[s.side]} · ` : ''}
                  {e.reps.kind === '21s'
                    ? `${kg(s.weightKg)} kg · ${s.done ? 'completa' : 'incompleta'}`
                    : `${logsWeight(e) ? `${kg(s.weightKg)} × ` : '× '}${s.reps ?? '–'}`}
                </span>
                <span className={styles.doneMark}>{s.done ? <CheckMark size={18} /> : null}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Sheet title="Serie" open={toDelete !== null} onClose={() => setToDelete(null)}>
        <div className={styles.sheetPad}>
          <p className={styles.muted}>¿Borrar esta serie? Se quita del registro de hoy.</p>
          <Button
            variant="secondary"
            block
            onClick={() => {
              if (toDelete) void deleteSet(toDelete.id)
              setToDelete(null)
              toast('Serie borrada')
            }}
          >
            Borrar serie
          </Button>
        </div>
      </Sheet>
    </section>
  )
}
