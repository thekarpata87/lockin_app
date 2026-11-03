import { useEffect, useState } from 'react'
import { toISODate } from '../lib/dates'

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** Local date and HH:mm, refreshed every 30 s and when the app comes back to the foreground. */
export function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 30_000)
    const onVis = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])
  return { date: toISODate(now), time: hhmm(now) }
}
