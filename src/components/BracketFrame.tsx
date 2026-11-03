import styles from './BracketFrame.module.css'

type Props = {
  active?: boolean
  /** Inset from the parent's edges, in px. */
  inset?: number
}

/** Viewfinder corner marks (⌜ ⌝ ⌞ ⌟). Parent must be position: relative. */
export function BracketFrame({ active = false, inset = 0 }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.frame} ${active ? styles.active : ''}`}
      style={{ inset }}
    >
      <span className={`${styles.c} ${styles.tl}`} />
      <span className={`${styles.c} ${styles.tr}`} />
      <span className={`${styles.c} ${styles.bl}`} />
      <span className={`${styles.c} ${styles.br}`} />
    </span>
  )
}
