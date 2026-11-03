import { useEffect, useRef, useState } from 'react'

/** Element width, kept in sync with ResizeObserver. */
export function useWidth<T extends HTMLElement>(fallback = 343) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth || fallback)
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [fallback])
  return [ref, width] as const
}
