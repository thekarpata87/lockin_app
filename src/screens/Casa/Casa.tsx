import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '../../components/Button'
import { CheckMark } from '../../components/CheckMark'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { Segmented } from '../../components/Segmented'
import { CARDIO_BY_ID, CARDIO_RULES, CIRCUIT_B, HOME_CARDIO_WEEK } from '../../data/cardio'
import type { CardioKind } from '../../data/cardio'
import { listCardio } from '../../db/repo/cardio'
import { useClock } from '../../hooks/useClock'
import { unlockAudio } from '../../lib/audio'
import { addDays, dayKeyOf, weekStartOf } from '../../lib/dates'
import { startTimer } from '../../lib/timer'
import { cRuleWarning } from '../../lib/cardio'
import { setRun, useRun } from './run'
import { TimerView } from './TimerView'
import styles from './Casa.module.css'

type HomeKind = Exclude<CardioKind, 'post'>
const OPTIONS: { value: HomeKind; label: string }[] = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'largo', label: 'Largo' },
]
const KIND_LABEL: Record<CardioKind, string> = { post: 'Post-gym', A: 'A', B: 'B', C: 'C', largo: 'Largo' }

export function Casa() {
  const { date } = useClock()
  const run = useRun()
  const dayKey = dayKeyOf(date)
  const suggested = HOME_CARDIO_WEEK[dayKey]
  const [kind, setKind] = useState<HomeKind>((suggested.main ?? 'A') as HomeKind)
  const [largoMin, setLargoMin] = useState<45 | 60>(45)
  const weekStart = weekStartOf(date)
  const logs = useLiveQuery(() => listCardio(addDays(weekStart, -1), addDays(weekStart, 6)), [weekStart]) ?? []
  const todayLogs = logs.filter((l) => l.date === date)
  const s = CARDIO_BY_ID.get(kind)!
  const warning = kind === 'C' ? cRuleWarning(logs, date) : null

  const start = () => {
    unlockAudio()
    setRun({ kind, minutes: kind === 'largo' ? largoMin : undefined, date, state: startTimer(Date.now()) })
  }

  return (
    <>
      <ScreenHeader title="CASA" />
      <section className={styles.block}>
        <SectionLabel>Sugerida hoy</SectionLabel>
        <p className={styles.title}>
          {suggested.main
            ? `${KIND_LABEL[suggested.main]} · ${CARDIO_BY_ID.get(suggested.main)?.name}${suggested.alt ? ` (o ${KIND_LABEL[suggested.alt]})` : ''}`
            : CARDIO_RULES.restDay}
        </p>
      </section>

      <Segmented label="Sesión" options={OPTIONS} value={kind} onChange={setKind} />

      <section className={styles.block}>
        <p className={styles.title}>{s.name}</p>
        <p className={styles.muted}>
          {s.minutes.min === s.minutes.max ? `${s.minutes.min} min` : `${s.minutes.min}–${s.minutes.max} min`} · {s.description}
        </p>
        <p className={styles.muted}>{CARDIO_RULES.zone2}</p>
      </section>

      {kind === 'largo' ? (
        <Segmented
          label="Duración"
          options={[
            { value: 45, label: '45 min' },
            { value: 60, label: '60 min' },
          ]}
          value={largoMin}
          onChange={(v) => setLargoMin(v as 45 | 60)}
        />
      ) : null}

      {kind === 'B' ? (
        <ol className={styles.list} aria-label="Ejercicios del circuito">
          {CIRCUIT_B.map((e, i) => (
            <li key={e.id} className={styles.row}>
              <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.rowText}>
                <span>{e.name}</span>
                <span className={styles.muted}>{e.cue}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {warning ? <p className={styles.warn}>{warning}</p> : null}
      {kind === 'B' || kind === 'C' ? <p className={styles.note}>{CARDIO_RULES.knees}</p> : null}

      <div className={styles.actions}>
        <Button block onClick={start}>
          {kind === 'B' ? 'Iniciar circuito' : 'Iniciar cardio'}
        </Button>
      </div>

      {todayLogs.length ? (
        <section aria-label="Cardio de hoy">
          <div className={styles.sectionHead}>
            <SectionLabel>Hoy</SectionLabel>
          </div>
          {todayLogs.map((l) => (
            <div key={l.id} className={styles.row}>
              <span className={styles.rowText}>
                <span>
                  {KIND_LABEL[l.kind]} · {CARDIO_BY_ID.get(l.kind)?.name}
                </span>
                <span className={styles.muted}>
                  {l.minutes} min{l.completed ? '' : ' · incompleta'}
                </span>
              </span>
              <span className={styles.doneMark}>{l.completed ? <CheckMark /> : null}</span>
            </div>
          ))}
        </section>
      ) : null}

      {run ? <TimerView run={run} /> : null}
    </>
  )
}
