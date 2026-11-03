import { useRef } from 'react'
import styles from './BlockRow.module.css'

type Props = {
  label: string
  filled: number
  total: number
  /** Tap on cell `index` (0-based). */
  onTap: (index: number) => void
  /** Long press: empty the row. */
  onClear: () => void
}

const LONG_PRESS_MS = 500

/** Group name, N square cells and the "2/3" counter (DESIGN §6). */
export function BlockRow({ label, filled, total, onTap, onClear }: Props) {
  const timer = useRef<number | undefined>(undefined)
  const longPressed = useRef(false)

  const start = () => {
    longPressed.current = false
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      longPressed.current = true
      onClear()
    }, LONG_PRESS_MS)
  }
  const cancel = () => window.clearTimeout(timer.current)

  return (
    <div className={styles.row} role="group" aria-label={`${label}, ${filled} de ${total}`}>
      <div className={styles.label}>
        <span>{label}</span>
        <span className={styles.count} aria-hidden="true">
          {filled}/{total}
        </span>
      </div>
      <div className={styles.cells}>
        {Array.from({ length: total }, (_, i) => {
          const on = i < filled
          return (
            <button
              key={i}
              type="button"
              className={styles.hit}
              aria-label={`${label}, bloque ${i + 1} de ${total}${on ? ', lleno' : ''}`}
              aria-pressed={on}
              onPointerDown={start}
              onPointerUp={cancel}
              onPointerLeave={cancel}
              onPointerCancel={cancel}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                if (longPressed.current) return
                onTap(i)
              }}
            >
              <span className={`${styles.cell} ${on ? styles.on : ''}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
