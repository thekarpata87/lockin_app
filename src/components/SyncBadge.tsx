import { useEffect, useState } from 'react'
import styles from './SyncBadge.module.css'

export type SyncState =
  | { kind: 'synced' }
  | { kind: 'pending'; count: number }
  | { kind: 'offline' }
  | { kind: 'error' }
  | { kind: 'local' }

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

function text(s: SyncState): string {
  switch (s.kind) {
    case 'synced':
      return 'Sincronizado'
    case 'pending':
      return s.count === 1 ? '1 pendiente' : `${s.count} pendientes`
    case 'offline':
      return 'Sin conexión'
    case 'error':
      return 'Error al sincronizar'
    case 'local':
      return ''
  }
}

/**
 * Until the sync engine lands (M8) the badge only reflects connectivity.
 */
export function SyncBadge({ state }: { state?: SyncState }) {
  const online = useOnline()
  const s: SyncState = state ?? (online ? { kind: 'local' } : { kind: 'offline' })
  if (s.kind === 'local') return null
  return (
    <span className={styles.badge} role="status">
      <span className={`${styles.marker} ${styles[s.kind]}`} aria-hidden="true" />
      {text(s)}
    </span>
  )
}
