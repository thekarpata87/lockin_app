import type { ReactNode } from 'react'
import styles from './SectionLabel.module.css'

export function SectionLabel({ children, as: Tag = 'h2' }: { children: ReactNode; as?: 'h2' | 'h3' | 'p' }) {
  return (
    <Tag className={styles.label}>
      <span className={styles.marker} aria-hidden="true" />
      {children}
    </Tag>
  )
}
