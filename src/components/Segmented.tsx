import styles from './Segmented.module.css'

type Props<T extends string | number> = {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}

/** Contiguous cells; the selected one is inverted (DESIGN §6). */
export function Segmented<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className={styles.seg} role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
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
