import { GROUPS } from '../data/foods'
import { GROUP_ORDER } from '../data/types'
import type { Blocks } from '../data/types'
import styles from './MiniBlocks.module.css'

/** Block summary as mini cells: "P ■■■ L ■". */
export function MiniBlocks({ blocks }: { blocks: Blocks }) {
  const groups = GROUP_ORDER.filter((g) => (blocks[g] ?? 0) > 0)
  const label = groups.map((g) => `${GROUPS[g].name} ${blocks[g]}`).join(', ')
  return (
    <span className={styles.mini} aria-label={`Bloques: ${label}`} role="img">
      {groups.map((g) => (
        <span key={g} className={styles.group}>
          <span className={styles.letter}>{g}</span>
          {Array.from({ length: blocks[g] ?? 0 }, (_, i) => (
            <span key={i} className={styles.cell} />
          ))}
        </span>
      ))}
    </span>
  )
}
