import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '../../components/Button'
import { LineChart } from '../../components/LineChart'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { Segmented } from '../../components/Segmented'
import { Slide } from '../../components/Slide'
import { Sheet } from '../../components/Sheet'
import { EXERCISE_BY_ID, RECORD_EXERCISES } from '../../data/routines'
import { WEIGH_IN_GUIDE } from '../../data/rules'
import { allBodyMetrics, getBodyMetric, latestBodyMetric } from '../../db/repo/bodyMetrics'
import { listDailyLogs } from '../../db/repo/dailyLogs'
import { getSettings } from '../../db/repo/settings'
import { listSessions, setsForExercises } from '../../db/repo/workouts'
import { useClock } from '../../hooks/useClock'
import { addDays, fromISODate } from '../../lib/dates'
import { avgSeries, compliance, records, stats, suggestions, weeklyTable, weighIns } from '../../lib/progress'
import { WeightForm } from '../Hoy/HeroStats'
import { WeekGrid } from './WeekGrid'
import styles from './Progreso.module.css'

type Range = 28 | 84 | 0
const RANGES: { value: Range; label: string }[] = [
  { value: 28, label: '4 sem' },
  { value: 84, label: '12 sem' },
  { value: 0, label: 'Todo' },
]

const kg = (n: number) => n.toFixed(1)
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`
const shortDate = (iso: string) => format(fromISODate(iso), 'd MMM', { locale: es })

export function Progreso() {
  const { date } = useClock()
  const [range, setRange] = useState<Range>(28)
  const [weighing, setWeighing] = useState(false)
  const settings = useLiveQuery(getSettings)
  const metrics = useLiveQuery(allBodyMetrics)
  const todayMetric = useLiveQuery(() => getBodyMetric(date), [date])
  const latestMetric = useLiveQuery(latestBodyMetric)
  const logs = useLiveQuery(() => listDailyLogs(addDays(date, -10), date), [date]) ?? []
  const sessions = useLiveQuery(() => listSessions(addDays(date, -7), date), [date]) ?? []
  const sets = useLiveQuery(() => setsForExercises(RECORD_EXERCISES)) ?? []

  if (!settings || !metrics) return <ScreenHeader title="PROGRESO" />

  const ws = weighIns(metrics)
  const s = stats(ws, date, settings.goalKg)
  const weeks = weeklyTable(ws, settings.startDate).reverse()
  const comp = compliance(logs, date, settings.startDate)
  const recs = records(sets, RECORD_EXERCISES)
  const tips = suggestions({ date, startDate: settings.startDate, weighIns: ws, logs, sessions })
  const waist = metrics.filter((m) => typeof m.waistCm === 'number')

  const first = ws[0]?.date
  const from = range === 0 ? (first ?? date) : addDays(date, -(range - 1))
  const inRange = ws.filter((w) => w.date >= from && w.date <= date)
  const avgLine = avgSeries(ws).filter((p) => p.date >= from)

  return (
    <>
      <ScreenHeader title="PROGRESO" />

      <section className={styles.hero} aria-label="Peso actual">
        <span className={`${styles.mk} ${styles.mkTl}`} aria-hidden="true" />
        <span className={`${styles.mk} ${styles.mkTr}`} aria-hidden="true" />
        <span className={`${styles.mk} ${styles.mkBl}`} aria-hidden="true" />
        <span className={`${styles.mk} ${styles.mkBr}`} aria-hidden="true" />
        <p className={`display ${styles.heroNumber}`}>{s.latest ? kg(s.latest.weightKg) : '—'}</p>
        <div className={styles.heroFoot}>
          <span className={styles.muted}>{s.latest ? `kg · ${s.latest.date === date ? 'hoy' : shortDate(s.latest.date)}` : 'Sin registros de peso'}</span>
          <Button variant="secondary" onClick={() => setWeighing(true)}>
            Registrar peso
          </Button>
        </div>
      </section>

      {!ws.length ? (
        <p className={styles.empty}>Sin registros de peso. Registra el de hoy.</p>
      ) : (
        <>
          <div className={styles.statGrid}>
            <Stat value={s.avg7 !== null ? kg(s.avg7) : '—'} label="Promedio 7 días" />
            <Stat value={s.fromStart !== null ? signed(s.fromStart) : '—'} label="kg desde el inicio" />
            <Stat value={s.toGoal !== null ? kg(Math.max(0, s.toGoal)) : '—'} label={`kg para la meta (${settings.goalKg})`} />
            <Stat value={s.pace !== null ? signed(s.pace) : '—'} label="kg por semana" />
          </div>

          <Segmented label="Rango de la gráfica" options={RANGES} value={range} onChange={setRange} />
          <Slide id={String(range)} pos={RANGES.findIndex((r) => r.value === range)}>
          <LineChart
            points={inRange.map((w) => ({ date: w.date, value: w.weightKg }))}
            avg={avgLine.map((p) => ({ date: p.date, value: p.avg }))}
            goal={settings.goalKg}
            from={from}
            to={date}
          />
          </Slide>
          <p className={styles.legend}>
            <span className={styles.legDot} /> Diario <span className={styles.legLine} /> Promedio 7 días <span className={styles.legGoal} /> Meta
          </p>
        </>
      )}

      {tips.length ? (
        <section aria-label="Sugerencias">
          <div className={styles.sectionHead}>
            <SectionLabel>Sugerencias</SectionLabel>
          </div>
          {tips.map((t) => (
            <p key={t.id} className={styles.tip}>
              {t.message}
            </p>
          ))}
          <p className={styles.note}>Solo son sugerencias; la app no cambia tu plan.</p>
        </section>
      ) : null}

      <WeekGrid date={date} />

      <div className={styles.sectionHead}>
        <SectionLabel>Cumplimiento</SectionLabel>
      </div>
      <div className={styles.statGrid}>
        <Stat value={comp.pct !== null ? `${comp.pct}%` : '—'} label="Bloques en 7 días" />
        <Stat value={String(comp.streak)} label={comp.streak === 1 ? 'día completo seguido' : 'días completos seguidos'} />
      </div>

      {weeks.length ? (
        <section aria-label="Semanas">
          <div className={styles.sectionHead}>
            <SectionLabel>Semanas</SectionLabel>
          </div>
          {weeks.map((w) => (
            <div key={w.weekStart} className={styles.weekRow}>
              <span className={styles.weekName}>
                Sem {w.index}
                <span className={styles.muted}>
                  {shortDate(w.weekStart)} · {w.count} {w.count === 1 ? 'registro' : 'registros'}
                </span>
              </span>
              <span className={styles.weekAvg}>{kg(w.avg)}</span>
              <span className={styles.weekDiff}>{w.diff !== null ? signed(w.diff) : '—'}</span>
            </div>
          ))}
        </section>
      ) : null}

      {waist.length ? (
        <section aria-label="Cintura">
          <div className={styles.sectionHead}>
            <SectionLabel>Cintura</SectionLabel>
          </div>
          {[...waist].reverse().map((m, i, arr) => {
            const firstW = arr[arr.length - 1]!.waistCm!
            return (
              <div key={m.date} className={styles.weekRow}>
                <span className={styles.weekName}>{shortDate(m.date)}</span>
                <span className={styles.weekAvg}>{m.waistCm!.toFixed(1)} cm</span>
                <span className={styles.weekDiff}>{i < arr.length - 1 ? signed(m.waistCm! - firstW) : '—'}</span>
              </div>
            )
          })}
        </section>
      ) : null}

      <div className={styles.sectionHead}>
        <SectionLabel>Récords en el gym</SectionLabel>
      </div>
      {recs.length ? (
        recs.map((r) => (
          <div key={r.exerciseId} className={styles.recordRow}>
            <span>{EXERCISE_BY_ID.get(r.exerciseId)?.name}</span>
            <span className={styles.recordValue}>
              {kg(r.weightKg)} kg × {r.reps}
            </span>
          </div>
        ))
      ) : (
        <p className={styles.note}>Aún no hay récords. Registra series en GYM.</p>
      )}

      <p className={styles.note}>{WEIGH_IN_GUIDE}</p>

      <Sheet title="Peso de hoy" open={weighing} onClose={() => setWeighing(false)}>
        {weighing ? <WeightForm date={date} today={todayMetric} latest={latestMetric} onDone={() => setWeighing(false)} /> : null}
      </Sheet>
    </>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.number}>{value}</span>
      <span className={styles.muted}>{label}</span>
    </div>
  )
}
