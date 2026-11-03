import { useWidth } from '../hooks/useWidth'
import { daysBetween } from '../lib/dates'
import styles from './LineChart.module.css'

type Props = {
  points: { date: string; value: number }[]
  avg: { date: string; value: number }[]
  goal: number
  from: string
  to: string
}

const H = 220
const PAD = { top: 12, right: 12, bottom: 24, left: 40 }

/** Own SVG chart (DESIGN §6): 1px grid, daily dots, 7-day average line, dashed goal line. */
export function LineChart({ points, avg, goal, from, to }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const span = Math.max(1, daysBetween(from, to))
  const values = [...points.map((p) => p.value), ...avg.map((p) => p.value)]
  const top = Math.ceil(Math.max(...values, goal) + 0.5)
  const bottom = Math.floor(Math.min(...values, goal) - 0.5)
  const range = Math.max(1, top - bottom)
  const innerW = width - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (d: string) => PAD.left + (daysBetween(from, d) / span) * innerW
  const y = (v: number) => PAD.top + ((top - v) / range) * innerH

  const stepKg = range > 12 ? 4 : range > 6 ? 2 : 1
  const ticks: number[] = []
  for (let v = Math.ceil(bottom / stepKg) * stepKg; v <= top; v += stepKg) ticks.push(v)
  const cols = 4
  const line = avg.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')

  return (
    <div ref={ref} className={styles.wrap}>
      <svg width={width} height={H} role="img" aria-label={`Gráfica de peso del ${from} al ${to}. Meta ${goal} kg.`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className={styles.grid} />
            <text x={PAD.left - 6} y={y(v) + 4} className={styles.tick} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {Array.from({ length: cols + 1 }, (_, i) => PAD.left + (innerW * i) / cols).map((gx) => (
          <line key={gx} x1={gx} x2={gx} y1={PAD.top} y2={H - PAD.bottom} className={styles.grid} />
        ))}
        <line x1={PAD.left} x2={width - PAD.right} y1={y(goal)} y2={y(goal)} className={styles.goal} />
        <text x={width - PAD.right} y={y(goal) - 6} className={styles.goalLabel} textAnchor="end">
          Meta {goal}
        </text>
        {points.map((p) => (
          <rect key={p.date} x={x(p.date) - 2} y={y(p.value) - 2} width={4} height={4} className={styles.dot} />
        ))}
        {avg.length > 1 ? <path d={line} className={styles.avg} /> : null}
        <text x={PAD.left} y={H - 6} className={styles.tick}>
          {from.slice(8)}/{from.slice(5, 7)}
        </text>
        <text x={width - PAD.right} y={H - 6} className={styles.tick} textAnchor="end">
          {to.slice(8)}/{to.slice(5, 7)}
        </text>
      </svg>
    </div>
  )
}
