import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import styles from './Sheet.module.css'

type Props = { title: string; open: boolean; onClose: () => void; children: ReactNode }

const EXIT_MS = 220

/** Bottom panel that slides up and back down (DESIGN §6, §8). */
export function Sheet({ title, open, onClose, children }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  // Keep the last content on screen while it slides out.
  const [shown, setShown] = useState(open)
  const [closing, setClosing] = useState(false)
  const last = useRef<{ title: string; children: ReactNode }>({ title, children })
  if (open) last.current = { title, children }

  useEffect(() => {
    if (open) {
      setShown(true)
      setClosing(false)
      return
    }
    if (!shown) return
    setClosing(true)
    const t = window.setTimeout(() => {
      setShown(false)
      setClosing(false)
    }, EXIT_MS)
    return () => window.clearTimeout(t)
  }, [open, shown])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!shown && !open) return null
  return createPortal(
    <div className={`${styles.backdrop} ${closing ? styles.closing : ''}`} onClick={onClose}>
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={last.current.title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>{last.current.title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>{last.current.children}</div>
      </div>
    </div>,
    document.body,
  )
}
