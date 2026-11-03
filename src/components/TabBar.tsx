import type { CSSProperties } from 'react'
import { NavLink, useLocation } from 'react-router'
import { Dumbbell, House, LayoutGrid, TrendingDown, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BracketFrame } from './BracketFrame'
import styles from './TabBar.module.css'

const TABS: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/hoy', label: 'HOY', Icon: LayoutGrid },
  { to: '/comida', label: 'COMIDA', Icon: UtensilsCrossed },
  { to: '/gym', label: 'GYM', Icon: Dumbbell },
  { to: '/casa', label: 'CASA', Icon: House },
  { to: '/progreso', label: 'PROGRESO', Icon: TrendingDown },
]

export function TabBar() {
  const { pathname } = useLocation()
  const index = TABS.findIndex((t) => pathname.startsWith(t.to))
  return (
    <nav className={styles.bar} aria-label="Secciones" style={{ '--i': Math.max(0, index) } as CSSProperties}>
      {/* One viewfinder frame that travels to the active tab */}
      {index >= 0 ? (
        <span className={styles.cursor} aria-hidden="true">
          <BracketFrame active inset={6} />
        </span>
      ) : null}
      {TABS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>
          <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
