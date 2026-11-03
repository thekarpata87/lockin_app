import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router'
import { Settings } from 'lucide-react'
import { SyncBadge } from './SyncBadge'
import styles from './ScreenHeader.module.css'

function shortDate(d: Date) {
  const s = format(d, 'EEE d MMM', { locale: es }).replace(/\./g, '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function ScreenHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <span className={styles.date}>{kicker ?? shortDate(new Date())}</span>
        <span className={styles.right}>
          <SyncBadge />
          <Link to="/ajustes" className={styles.gear} aria-label="Ajustes">
            <Settings size={20} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </span>
      </div>
      <h1 className={`display ${styles.title}`}>{title}</h1>
    </header>
  )
}
