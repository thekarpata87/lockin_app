import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useSyncState } from '../sync/engine'
import type { SyncState } from '../sync/engine'
import styles from './SyncBadge.module.css'

type View = { kind: 'synced' | 'pending' | 'offline' | 'error' | 'signedOut' | 'syncing'; text: string } | null

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function badgeView(s: SyncState, online: boolean): View {
  if (s.status === 'disabled') return online ? null : { kind: 'offline', text: 'Sin conexión' }
  if (!online || s.status === 'offline') return { kind: 'offline', text: 'Sin conexión' }
  if (s.status === 'signedOut') return { kind: 'signedOut', text: 'Sin sesión' }
  if (s.status === 'error') return { kind: 'error', text: 'Error al sincronizar' }
  if (s.pending > 0) return { kind: 'pending', text: s.pending === 1 ? '1 pendiente' : `${s.pending} pendientes` }
  if (s.status === 'syncing') return { kind: 'syncing', text: 'Sincronizando' }
  return { kind: 'synced', text: 'Sincronizado' }
}

/** ■ + text (DESIGN §6). Tapping opens the account screen (detail and retry). */
export function SyncBadge() {
  const s = useSyncState()
  const online = useOnline()
  const v = badgeView(s, online)
  if (!v) return null
  return (
    <Link to="/cuenta" className={styles.badge} aria-label={`${v.text}. Abrir cuenta y sincronización`}>
      <span className={`${styles.marker} ${styles[v.kind]}`} aria-hidden="true" />
      {v.text}
    </Link>
  )
}
