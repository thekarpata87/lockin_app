import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type Props = {
  /** Changing the id replays the animation (never on first mount). */
  id: string
  /** Position used to pick the direction (higher = to the right). */
  pos?: number
  variant?: 'slide' | 'push' | 'rise' | 'fade'
  children: ReactNode
  className?: string
}

type State = { id: string; pos: number; dir: number; changed: boolean }

/** Wraps a block so it slides in when its id changes, toward the direction of travel. */
export function Slide({ id, pos = 0, variant = 'slide', children, className }: Props) {
  const s = useRef<State | null>(null)
  if (!s.current) s.current = { id, pos, dir: 1, changed: false }
  else if (s.current.id !== id) s.current = { id, pos, dir: pos >= s.current.pos ? 1 : -1, changed: true }
  return (
    <div
      key={id}
      className={`${s.current.changed ? `anim-${variant}` : ''} ${className ?? ''}`}
      style={{ '--dir': s.current.dir, display: 'flex', flexDirection: 'column' } as CSSProperties}
    >
      {children}
    </div>
  )
}
