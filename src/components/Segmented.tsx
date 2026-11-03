import type { CSSProperties } from 'react'
import styles from './Segmented.module.css'

type Props<T extends string | number> = {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}

/** Contiguous cells; an inverted block slides to the selected one (DESIGN §6, §8). */
export function Segmented<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  const index = options.findIndex((o) => o.value === value)
  const n = options.length
  return (
    <div
      className={styles.seg}
      role="radiogroup"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, '--n': n, '--i': Math.max(0, index) } as CSSProperties}
    >
      {index >= 0 ? <span className={styles.indicator} aria-hidden="true" /> : null}
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`${styles.opt} ${o.value === value ? styles.on : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
