import { SectionLabel } from '../../components/SectionLabel'
import { GROUPS } from '../../data/foods'
import { GROUP_ORDER } from '../../data/types'
import type { MealKey } from '../../data/types'
import type { MealLog } from '../../db/schema'
import { dayFilled, dayTargets, remainingToday, totalBlocks } from '../../lib/blocks'
import styles from './Hoy.module.css'

const SHORT: Record<string, string> = { V: 'Verduras', F: 'Frutas', C: 'Cereales', P: 'Proteína', L: 'Leche', G: 'Grasas' }

/** Six big tiles that fill from the bottom as meals get checked. */
export function DayBlocks({ meals }: { meals: Partial<Record<MealKey, MealLog>> }) {
  const target = dayTargets()
  const filled = dayFilled(meals)
  const missing = remainingToday(meals)
  const done = totalBlocks(filled)
  const total = totalBlocks(target)

  return (
    <section aria-label="Bloques de hoy">
      <div className={styles.blockHead}>
        <SectionLabel>Bloques de hoy</SectionLabel>
        <span className={styles.figure}>
          {done}/{total}
        </span>
      </div>
      <div className={styles.tiles}>
        {GROUP_ORDER.map((g) => {
          const t = target[g] ?? 0
          const f = filled[g] ?? 0
          const full = f >= t
          return (
            <div key={g} className={`${styles.tile} ${full ? styles.tileFull : ''}`} role="img" aria-label={`${GROUPS[g].name}, ${f} de ${t}`}>
              <span className={styles.tileFill} style={{ transform: `scaleY(${t ? f / t : 0})` }} />
              <span className={styles.tileName}>{SHORT[g]}</span>
              <span className={styles.tileCount}>
                {f}
                <span className={styles.tileOf}>/{t}</span>
              </span>
            </div>
          )
        })}
      </div>
      <p className={styles.missing}>
        {missing.length
          ? `Te falta: ${missing.map((m) => `${SHORT[m.group]!.toLowerCase()} ${m.missing}`).join(' · ')}`
          : 'Completaste todos los bloques del día.'}
      </p>
    </section>
  )
}
