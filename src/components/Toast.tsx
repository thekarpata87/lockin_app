import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Toast.module.css'

const ToastCtx = createContext<(text: string) => void>(() => undefined)

export const useToast = () => useContext(ToastCtx)

const DURATION_MS = 2500
const EXIT_MS = 200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; id: number; leaving: boolean } | null>(null)
  const timers = useRef<number[]>([])

  const show = useCallback((text: string) => {
    timers.current.forEach((t) => window.clearTimeout(t))
    setMsg({ text, id: Date.now(), leaving: false })
    timers.current = [
      window.setTimeout(() => setMsg((m) => (m ? { ...m, leaving: true } : m)), DURATION_MS),
      window.setTimeout(() => setMsg(null), DURATION_MS + EXIT_MS),
    ]
  }, [])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {msg ? (
          <div key={msg.id} className={`${styles.toast} ${msg.leaving ? styles.leaving : ''}`}>
            {msg.text}
          </div>
        ) : null}
      </div>
    </ToastCtx.Provider>
  )
}
