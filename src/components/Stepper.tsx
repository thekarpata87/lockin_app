import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { parseDecimal } from '../lib/today'
import styles from './Stepper.module.css'

type Props = {
  label: string
  value: number
  onChange: (v: number) => void
  step: number
  min?: number
  max?: number
  decimals?: number
  unit?: string
  inputMode?: 'decimal' | 'numeric'
}

const roundTo = (v: number, d: number) => Number(v.toFixed(d))

/** [ − ]  value  [ + ]. Tap the value to type. Hold − / + to repeat. */
export function Stepper({ label, value, onChange, step, min = 0, max = 999, decimals = 1, unit, inputMode = 'decimal' }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const repeat = useRef<number | undefined>(undefined)
  const latest = useRef(value)
  const repeated = useRef(false)
  latest.current = value

  const clamp = (v: number) => roundTo(Math.min(max, Math.max(min, v)), decimals)

  const stop = () => {
    window.clearTimeout(repeat.current)
    window.clearInterval(repeat.current)
  }
  useEffect(() => stop, [])

  const nudge = (dir: 1 | -1) => {
    const next = clamp(latest.current + dir * step)
    latest.current = next
    onChange(next)
  }
  const hold = (dir: 1 | -1) => {
    stop()
    repeated.current = false
    repeat.current = window.setTimeout(() => {
      repeated.current = true
      repeat.current = window.setInterval(() => nudge(dir), 80)
    }, 400)
  }
  // A click right after a hold-repeat would add one extra step.
  const tap = (dir: 1 | -1) => {
    if (repeated.current) {
      repeated.current = false
      return
    }
    nudge(dir)
  }

  const commit = () => {
    if (draft === null) return
    const n = parseDecimal(draft)
    if (n !== undefined) onChange(clamp(n))
    setDraft(null)
  }

  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button
        type="button"
        className={styles.btn}
        aria-label={`Bajar ${label}`}
        onClick={() => tap(-1)}
        onPointerDown={() => hold(-1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Minus size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <label className={styles.value}>
        <input
          className={styles.input}
          type="text"
          inputMode={inputMode}
          enterKeyHint="done"
          aria-label={label}
          value={draft ?? value.toFixed(decimals)}
          onFocus={(e) => {
            setDraft(value.toFixed(decimals))
            requestAnimationFrame(() => e.target.select())
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </label>
      <button
        type="button"
        className={styles.btn}
        aria-label={`Subir ${label}`}
        onClick={() => tap(1)}
        onPointerDown={() => hold(1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Plus size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  )
}
