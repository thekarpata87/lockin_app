import type { ReactNode } from 'react'
import { ArrowCell } from './ArrowCell'
import { BlockRow } from './BlockRow'
import { Button } from './Button'
import { GROUPS } from '../data/foods'
import type { Blocks, Group } from '../data/types'
import styles from './MealCard.module.css'

type Props = {
  id?: string
  name: string
  time: string
  /** Recipe name, or a hint when there is none. */
  subtitle: ReactNode
  groups: Group[]
  targets: Blocks
  filled: Blocks
  complete: boolean
  onTap: (g: Group, index: number) => void
  onClear: (g: Group) => void
  onFill: () => void
  onEmpty: () => void
  onOpen: () => void
  openLabel: string
  onSubtitle?: () => void
  subtitleLabel?: string
}

export function MealCard(p: Props) {
  return (
    <article id={p.id} className={`${styles.card} ${p.complete ? styles.complete : ''}`} aria-label={`${p.name}, ${p.time}`}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h3 className={styles.name}>
            {p.name} <span className={styles.time}>{p.time}</span>
          </h3>
          {p.onSubtitle ? (
            <button type="button" className={styles.subtitleBtn} onClick={p.onSubtitle} aria-label={p.subtitleLabel}>
              {p.subtitle}
            </button>
          ) : (
            <p className={styles.subtitle}>{p.subtitle}</p>
          )}
        </div>
        <div className={styles.arrow}>
          <ArrowCell label={p.openLabel} onClick={p.onOpen} />
        </div>
      </div>
      {p.groups.map((g) => (
        <BlockRow
          key={g}
          label={GROUPS[g].name}
          filled={Math.min(p.filled[g] ?? 0, p.targets[g] ?? 0)}
          total={p.targets[g] ?? 0}
          onTap={(i) => p.onTap(g, i)}
          onClear={() => p.onClear(g)}
        />
      ))}
      <div className={styles.actions}>
        {p.complete ? (
          <Button variant="ghost" onClick={p.onEmpty}>
            Vaciar comida
          </Button>
        ) : (
          <Button variant="secondary" block onClick={p.onFill}>
            Marcar como comida
          </Button>
        )}
      </div>
    </article>
  )
}
