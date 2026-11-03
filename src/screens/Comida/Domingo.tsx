import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { CheckMark } from '../../components/CheckMark'
import { SectionLabel } from '../../components/SectionLabel'
import { MEALS } from '../../data/foods'
import { PREP_DURATION, STORAGE_RULES } from '../../data/rules'
import type { DayKey } from '../../data/types'
import { changeBeep, unlockAudio } from '../../lib/audio'
import { containers, fmtOffset, freshMeals, prepSteps } from '../../lib/prep'
import { countdown, displaySeconds, formatClock } from '../../lib/timer'
import { holdWakeLock, WAKE_LOCK_HINT, wakeLockSupported } from '../../lib/wakelock'
import { clearAlarm, setAlarm } from '../../sync/alarms'
import { startStepTimer, stopStepTimer, toggleStepDone, usePrep } from './prepTimers'
import { useWeekPlan } from './week'
import { WeekToggle } from './WeekToggle'
import styles from './Comida.module.css'

const DAY_SHORT: Record<DayKey, string> = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' }

export function Domingo() {
  const { plan, weekStart } = useWeekPlan()
  const prep = usePrep(weekStart)
  const steps = prepSteps(plan)
  const boxes = containers(plan)
  const fresh = freshMeals(plan)
  const [now, setNow] = useState(() => Date.now())
  const finished = useRef(new Set<string>())

  useEffect(() => holdWakeLock(), [])
  const running = Object.keys(prep.timers).length > 0
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [running])

  // Notifications for running step timers if the phone gets locked.
  useEffect(() => {
    const ids = Object.keys(prep.timers)
    for (const [id, t] of Object.entries(prep.timers)) {
      const step = steps.find((s) => s.id === id)
      if (step) setAlarm(`prep:${id}`, t.endAt, 'Temporizador listo', step.text.split('.')[0]!)
    }
    return () => ids.forEach((id) => clearAlarm(`prep:${id}`))
  }, [prep.timers, steps])

  // Beep once when a step timer reaches zero (only if it ended just now).
  useEffect(() => {
    for (const [id, t] of Object.entries(prep.timers)) {
      if (now >= t.endAt && !finished.current.has(id)) {
        finished.current.add(id)
        if (now - t.endAt < 3000) {
          changeBeep()
          window.setTimeout(changeBeep, 400)
          window.setTimeout(changeBeep, 800)
        }
      }
    }
  }, [now, prep.timers])

  if (!steps.length) {
    return (
      <>
        <WeekToggle />
        <p className={styles.empty}>Esta semana no tiene recetas de meal prep. Elige y distribuye recetas en Semana.</p>
      </>
    )
  }

  return (
    <>
      <WeekToggle />
      <div className={styles.listHead}>
        <span className={styles.muted}>Duración aproximada: {PREP_DURATION}. Las horas son desde que empiezas.</span>
        <span className={styles.count}>
          {prep.done.filter((d) => steps.some((s) => s.id === d)).length}/{steps.length}
        </span>
      </div>
      {!wakeLockSupported() ? <p className={styles.note}>{WAKE_LOCK_HINT}</p> : null}
      <ol className={styles.prepList}>
        {steps.map((s, i) => {
          const isLast = s.id === 'p-etiquetar'
          const t = prep.timers[s.id]
          const c = t ? countdown(t.endAt, t.totalMs, now) : null
          const done = prep.done.includes(s.id)
          return (
            <li key={s.id} className={`${styles.prepStep} ${done ? styles.prepDone : ''}`}>
              <div className={styles.prepHead}>
                <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.prepTime}>{fmtOffset(s.startMin)}</span>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={`Paso ${i + 1} hecho`}
                  className={`${styles.prepCheck} fill-box ${done ? `${styles.prepCheckOn} is-on` : ''}`}
                  onClick={() => toggleStepDone(weekStart, s.id)}
                >
                  {done ? <CheckMark size={20} /> : null}
                </button>
              </div>
              <p className={styles.prepText}>{s.text}</p>
              {s.timerMin ? (
                c ? (
                  <div className={styles.prepTimer}>
                    <div className={styles.restTrack}>
                      <div className={styles.restFill} style={{ transform: `scaleX(${c.fraction})` }} />
                    </div>
                    <div className={styles.prepTimerRow}>
                      <span className={styles.prepClock}>{c.done ? 'Listo' : formatClock(displaySeconds(c.remainingMs))}</span>
                      <Button variant="ghost" onClick={() => stopStepTimer(weekStart, s.id)}>
                        {c.done ? 'Quitar' : 'Cancelar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.prepTimer}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        unlockAudio()
                        finished.current.delete(s.id)
                        startStepTimer(weekStart, s.id, s.timerMin!.max)
                        setNow(Date.now())
                      }}
                    >
                      Iniciar {s.timerMin.min === s.timerMin.max ? s.timerMin.max : `${s.timerMin.min}–${s.timerMin.max}`} min
                    </Button>
                  </div>
                )
              ) : null}
              {isLast ? (
                <div className={styles.boxes}>
                  {(['Refri', 'Congelador'] as const).map((dest) => {
                    const list = boxes.filter((b) => b.dest === dest)
                    if (!list.length) return null
                    return (
                      <div key={dest}>
                        <SectionLabel as="h3">
                          {dest} · {list.length} {list.length === 1 ? 'contenedor' : 'contenedores'}
                        </SectionLabel>
                        <ul className={styles.boxList}>
                          {list.map((b) => (
                            <li key={`${b.day}:${b.meal}`}>
                              <span className={styles.boxDay}>{DAY_SHORT[b.day]}</span>
                              <span>
                                {MEALS[b.meal].name} · {b.name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                  {fresh.length ? (
                    <div>
                      <SectionLabel as="h3">Preparar fresco ese día</SectionLabel>
                      <ul className={styles.boxList}>
                        {fresh.map((f) => (
                          <li key={`${f.day}:${f.meal}`}>
                            <span className={styles.boxDay}>{DAY_SHORT[f.day]}</span>
                            <span>
                              {MEALS[f.meal].name} · {f.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className={styles.reminder}>{STORAGE_RULES.nightly}</p>
                  <p className={styles.muted}>{STORAGE_RULES.reheat}</p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </>
  )
}
