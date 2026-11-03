import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BracketFrame } from '../../components/BracketFrame'
import { Button } from '../../components/Button'
import { useToast } from '../../components/Toast'
import { CARDIO_BY_ID } from '../../data/cardio'
import { saveCardioSession } from '../../db/repo/cardio'
import { setHabit } from '../../db/repo/dailyLogs'
import { changeBeep, tickBeep } from '../../lib/audio'
import {
  buildPhases,
  displaySeconds,
  formatClock,
  pauseTimer,
  realMinutes,
  resumeTimer,
  skipPhase,
  timerAt,
} from '../../lib/timer'
import { holdWakeLock, WAKE_LOCK_HINT, wakeLockSupported } from '../../lib/wakelock'
import { setRun } from './run'
import type { Run } from './run'
import styles from './Casa.module.css'

/** Minutes that count the home-cardio habit when leaving early. */
const HABIT_MIN = 20

export function TimerView({ run }: { run: Run }) {
  const toast = useToast()
  const phases = useMemo(() => buildPhases(run.kind, run.minutes), [run.kind, run.minutes])
  const [now, setNow] = useState(() => Date.now())
  const [confirmExit, setConfirmExit] = useState(false)
  const v = timerAt(phases, run.state, now)
  const sec = displaySeconds(v.remainingMs)
  const session = CARDIO_BY_ID.get(run.kind)!
  const saved = useRef(false)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200)
    const onVis = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  useEffect(() => holdWakeLock(), [])

  // Beeps: 3-2-1 before each change, and on the change. Never replay missed ones after a freeze.
  const seen = useRef({ index: v.index, sec, at: now })
  useEffect(() => {
    const prev = seen.current
    const live = now - prev.at < 1500
    if (live && !v.paused) {
      if (v.index !== prev.index && v.index === prev.index + 1) changeBeep()
      else if (v.index === prev.index && sec !== prev.sec && sec >= 1 && sec <= 3) tickBeep()
    }
    seen.current = { index: v.index, sec, at: now }
  }, [v.index, sec, now, v.paused])

  const finish = async (completed: boolean) => {
    if (saved.current) return
    saved.current = true
    const t = Date.now()
    const minutes = realMinutes(phases, run.state, t)
    if (minutes >= 1) {
      await saveCardioSession({ date: run.date, kind: run.kind, minutes, completed })
      if (completed || minutes >= HABIT_MIN) await setHabit(run.date, 'homeCardio', true)
      toast(`Cardio guardado: ${minutes} min`)
    }
    setRun(null)
  }

  useEffect(() => {
    if (v.done) void finish(true)
  }, [v.done])

  const togglePause = () => {
    const t = Date.now()
    setRun({ ...run, state: v.paused ? resumeTimer(run.state, t) : pauseTimer(run.state, t) })
    setNow(t)
  }
  const skip = () => {
    const t = Date.now()
    setRun({ ...run, state: skipPhase(phases, run.state, t) })
    setNow(t)
  }

  const p = v.phase
  const isWork = p?.kind === 'work'
  const totalLeft = Math.max(0, Math.round((v.totalMs - v.programMs) / 1000))

  return createPortal(
    <div className={`${styles.timer} ${isWork ? styles.work : ''} ${v.paused ? styles.paused : ''}`} role="timer" aria-live="off">
      <div className={styles.timerTop}>
        <span className={`display ${styles.timerName}`}>{session.id === 'B' ? 'CIRCUITO B' : session.name}</span>
        <span className={styles.timerRound}>{p?.round ? `Ronda ${p.round} / ${p.rounds}` : `Quedan ${formatClock(totalLeft)}`}</span>
      </div>

      <div className={styles.timerMain}>
        <BracketFrame active={!isWork} inset={0} />
        <p className={`display ${styles.phase}`}>{v.paused ? 'PAUSA' : (p?.title ?? 'LISTO')}</p>
        <p className={`display ${styles.count}`} aria-label={`${sec} segundos`}>
          {formatClock(sec, true)}
        </p>
        {p?.kind === 'work' && p.detail ? <p className={styles.exercise}>{p.detail}</p> : null}
        {p?.cue && p.kind === 'work' ? <p className={styles.cue}>{p.cue}</p> : null}
        {p?.kind === 'rest' && p.detail ? <p className={styles.exercise}>{p.detail}</p> : null}
        {p && p.kind !== 'work' && p.kind !== 'rest' && p.detail ? <p className={styles.cue}>{p.detail}</p> : null}
        {p?.kind === 'work' && v.next ? (
          <p className={styles.cue}>
            Sigue: {v.next.kind === 'rest' ? `${v.next.title.toLowerCase()} ${v.next.sec} s` : v.next.title.toLowerCase()}
          </p>
        ) : null}
        {!wakeLockSupported() ? <p className={styles.cue}>{WAKE_LOCK_HINT}</p> : null}
      </div>

      {confirmExit ? (
        <div className={styles.exitBox}>
          <p className={styles.exitText}>
            Llevas {realMinutes(phases, run.state, now)} min. ¿Terminar y guardar?
          </p>
          <div className={styles.timerButtons}>
            <Button variant="inverse" block onClick={() => void finish(false)}>
              Terminar
            </Button>
            <Button variant="secondary" block onClick={() => setConfirmExit(false)}>
              Seguir
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.timerButtons}>
            <Button variant="inverse" block onClick={togglePause}>
              {v.paused ? 'Reanudar' : 'Pausa'}
            </Button>
            <Button variant="secondary" block onClick={skip}>
              Saltar
            </Button>
          </div>
          <button type="button" className={styles.exit} onClick={() => setConfirmExit(true)}>
            Salir
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}
