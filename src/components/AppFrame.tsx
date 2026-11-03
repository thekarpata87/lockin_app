import type { ReactNode } from 'react'
import styles from './AppFrame.module.css'

/** Bordered container with the 4-column grid drawn behind content (DESIGN §4). */
export function AppFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className={styles.outer}>
      <div className={styles.statusMask} aria-hidden="true" />
      <div className={styles.frame}>
        <main className={styles.main}>{children}</main>
      </div>
      {footer}
    </div>
  )
}
