import { useNavigate } from 'react-router'
import { ArrowCell } from '../../components/ArrowCell'
import { CheckMark } from '../../components/CheckMark'
import { SectionLabel } from '../../components/SectionLabel'
import { CARDIO_BY_ID } from '../../data/cardio'
import type { DayItem } from '../../lib/now'
import type { MealKey } from '../../data/types'
import { shortTime } from './format'
import styles from './Hoy.module.css'

type Props = {
  item: DayItem | undefined
  mealDetail: (m: MealKey) => string
  mealDone: (m: MealKey) => boolean
  onToggleMeal: (m: MealKey) => void
}

/** What's on now. Meals get the same checkbox as the list; gym and cardio get a shortcut. */
export function NowRow({ item, mealDetail, mealDone, onToggleMeal }: Props) {
  const navigate = useNavigate()
  if (!item) return null

  let detail = item.detail
  let go: (() => void) | undefined
  let goLabel = ''
  if (item.meal) {
    detail = mealDetail(item.meal)
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
  const meal = item.meal
  const done = meal ? mealDone(meal) : false
  return (
    <section className={styles.now} aria-label="Ahora">
      <div className={styles.nowText}>
        <SectionLabel>Ahora</SectionLabel>
        <p className={styles.nowTitle}>
          <span className={styles.nowTime}>{shortTime(item.start)}</span> {label}
        </p>
        {detail ? <p className={styles.nowDetail}>{detail}</p> : null}
      </div>
      {meal ? (
        <div className={styles.nowCheck}>
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label={`${label} hecha`}
            className={`${styles.box} ${styles.boxBig} ${done ? styles.boxOn : ''}`}
            onClick={() => onToggleMeal(meal)}
          >
            {done ? <CheckMark size={26} /> : null}
          </button>
        </div>
      ) : go ? (
        <div className={styles.nowArrow}>
          <ArrowCell label={goLabel} onClick={go} />
        </div>
      ) : null}
    </section>
  )
}
