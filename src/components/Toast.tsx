import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Toast.module.css'

const ToastCtx = createContext<(text: string) => void>(() => undefined)

export const useToast = () => useContext(ToastCtx)

const DURATION_MS = 2500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current)
    setMsg({ text, id: Date.now() })
    timer.current = window.setTimeout(() => setMsg(null), DURATION_MS)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {msg ? (
          <div key={msg.id} className={styles.toast}>
            {msg.text}
          </div>
        ) : null}
      </div>
    </ToastCtx.Provider>
  )
}
