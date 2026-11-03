import { SectionLabel } from '../../components/SectionLabel'
import { WATER } from '../../data/profile'
import { addWater, setWater } from '../../db/repo/dailyLogs'
import { formatLiters, tapWater, waterCells } from '../../lib/today'
import styles from './Hoy.module.css'

export function Water({ date, ml }: { date: string; ml: number }) {
  const filled = waterCells(ml)
  return (
    <section className={styles.block} aria-label="Agua">
      <div className={styles.blockHead}>
        <SectionLabel>
          Agua · {formatLiters(ml)} / {formatLiters(WATER.goalMl)} L
        </SectionLabel>
        <button type="button" className={styles.addWater} onClick={() => void addWater(date, WATER.cellMl)}>
          +250 ML
        </button>
      </div>
      <div className={styles.water} role="group" aria-label={`Agua, ${filled} de ${WATER.cells} vasos de 250 ml`}>
        {Array.from({ length: WATER.cells }, (_, i) => (
          <button
            key={i}
            type="button"
            className={styles.waterHit}
            aria-label={`Vaso ${i + 1} de ${WATER.cells}${i < filled ? ', lleno' : ''}`}
            aria-pressed={i < filled}
            onClick={() => void setWater(date, tapWater(ml, i))}
          >
            <span className={`${styles.waterCell} ${i < filled ? styles.waterOn : ''}`} />
          </button>
        ))}
      </div>
    </section>
  )
}
