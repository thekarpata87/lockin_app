import { useNavigate } from 'react-router'
import { ArrowCell } from '../../components/ArrowCell'
import { SectionLabel } from '../../components/SectionLabel'
import { CARDIO_BY_ID } from '../../data/cardio'
import type { DayItem } from '../../lib/now'
import type { MealKey } from '../../data/types'
import { shortTime } from './format'
import styles from './Hoy.module.css'

type Props = { item: DayItem | undefined; mealDetail: (m: MealKey) => string }

export function NowRow({ item, mealDetail }: Props) {
  const navigate = useNavigate()
  if (!item) return null

  let detail = item.detail
  let go: (() => void) | undefined
  let goLabel = ''
  if (item.meal) {
    detail = mealDetail(item.meal)
    const meal = item.meal
    go = () => document.getElementById(`meal-${meal}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    goLabel = 'Ir a la comida'
  } else if (item.kind === 'gym') {
    go = () => navigate('/gym')
    goLabel = 'Iniciar gym'
  } else if (item.cardio === 'home' && item.cardioKind) {
    const s = CARDIO_BY_ID.get(item.cardioKind)
    detail = s ? `${item.cardioKind === 'largo' ? 'Largo' : item.cardioKind} · ${s.name}` : detail
    go = () => navigate('/casa')
    goLabel = 'Iniciar circuito'
  }

  const label = item.meal ? item.label.replace(/ \(.*\)$/, '') : item.label
  return (
    <section className={styles.now} aria-label="Ahora">
      <div className={styles.nowText}>
        <SectionLabel>Ahora</SectionLabel>
        <p className={styles.nowTitle}>
          <span className={styles.nowTime}>{shortTime(item.start)}</span> {label}
        </p>
        {detail ? <p className={styles.nowDetail}>{detail}</p> : null}
      </div>
      {go ? (
        <div className={styles.nowArrow}>
          <ArrowCell label={goLabel} onClick={go} />
        </div>
      ) : null}
    </section>
  )
}
