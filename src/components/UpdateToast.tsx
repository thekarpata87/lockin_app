import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './UpdateToast.module.css'

const CHECK_EVERY_MS = 60 * 60 * 1000

/** "Nueva versión disponible" persistent toast + one-time "ready offline" notice. */
export function UpdateToast() {
  const regRef = useRef<ServiceWorkerRegistration | undefined>(undefined)
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      regRef.current = reg
      if (reg) setInterval(() => void reg.update(), CHECK_EVERY_MS)
    },
  })

  // iOS rarely checks for updates on its own: check whenever the app comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void regRef.current?.update()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if (!offlineReady) return
    const t = setTimeout(() => setOfflineReady(false), 2500)
    return () => clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  if (needRefresh) {
    return (
      <div className={styles.toast} role="status">
        <span className={styles.text}>Nueva versión disponible</span>
        <button type="button" className={styles.action} onClick={() => void updateServiceWorker(true)}>
          ACTUALIZAR
        </button>
      </div>
    )
  }
  if (offlineReady) {
    return (
      <div className={styles.toast} role="status">
        <span className={styles.text}>Lista para usarse sin conexión</span>
      </div>
    )
  }
  return null
}
