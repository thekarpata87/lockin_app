import { useEffect, useState } from 'react'
import styles from './Splash.module.css'

const TOTAL_MS = 2450
const REDUCED_MS = 700

/**
 * Launch animation: the orange block drops in, becomes a terminal cursor and types LOCK_IN.
 * Starts once the mono font is ready so the steps line up with the letters. Tap to skip.
 */
export function Splash() {
  const [phase, setPhase] = useState<'wait' | 'go' | 'gone'>('wait')

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let end: number | undefined
    const start = () => {
      setPhase('go')
      end = window.setTimeout(() => setPhase('gone'), reduced ? REDUCED_MS : TOTAL_MS)
    }
    const timeout = new Promise((r) => setTimeout(r, 400))
    void Promise.race([document.fonts?.load('700 44px "JetBrains Mono"') ?? Promise.resolve(), timeout]).then(start)
    return () => window.clearTimeout(end)
  }, [])

  if (phase === 'gone') return null
  return (
    <div className={`${styles.splash} ${phase === 'go' ? styles.go : ''}`} onClick={() => setPhase('gone')} aria-hidden="true">
      <div className={styles.center}>
        <div className={styles.line}>
          <span className={styles.typed}>LOCK_IN</span>
          <span className={styles.cursor} />
        </div>
        <div className={styles.byline}>
          <span className={styles.byTyped}>by thekarpata87</span>
        </div>
      </div>
    </div>
  )
}
