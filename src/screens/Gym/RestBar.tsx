import { useEffect, useRef, useState } from 'react'
import { changeBeep, tickBeep } from '../../lib/audio'
import { countdown, displaySeconds, formatClock } from '../../lib/timer'
import { stopRest } from './rest'
import type { Rest } from './rest'
import styles from './Gym.module.css'

/** Orange bar that empties under "Guardar serie" with the countdown in mono. */
export function RestBar({ rest }: { rest: Rest }) {
  const [now, setNow] = useState(() => Date.now())
  const lastBeep = useRef<number | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [])

  const c = countdown(rest.endAt, rest.totalMs, now)
  const sec = displaySeconds(c.remainingMs)

  const late = now - rest.endAt > 1500
  useEffect(() => {
    if (lastBeep.current === sec) return
    lastBeep.current = sec
    // Only beep live, not when coming back long after the end.
    if (late) return
    if (sec <= 3 && sec >= 1) tickBeep()
    if (sec === 0) changeBeep()
  }, [sec, late])

  useEffect(() => {
    if (!c.done) return
    const t = window.setTimeout(stopRest, 1200)
    return () => window.clearTimeout(t)
  }, [c.done])

  return (
    <div className={styles.rest} role="timer" aria-label={`Descanso, ${sec} segundos`}>
      <div className={styles.restTrack}>
        <div className={styles.restFill} style={{ transform: `scaleX(${c.fraction})` }} />
      </div>
      <div className={styles.restRow}>
        <span className={styles.restText}>{c.done ? 'Descanso terminado' : `Descanso ${formatClock(sec)}`}</span>
        <button type="button" className={styles.restSkip} onClick={stopRest}>
          Saltar
        </button>
      </div>
    </div>
  )
}
