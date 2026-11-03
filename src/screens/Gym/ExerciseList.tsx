import { BracketFrame } from '../../components/BracketFrame'
import { CheckMark } from '../../components/CheckMark'
import { SectionLabel } from '../../components/SectionLabel'
import type { Exercise } from '../../data/routines'
import type { SetLog } from '../../db/schema'
import { completedSeries, formatSets, repsLabel, targetSets } from '../../lib/gym'
import styles from './Gym.module.css'

type Props = {
  exercises: Exercise[]
  sets: SetLog[]
  last: Map<string, SetLog[]>
  reduced: boolean
  currentId?: string
  onSelect?: (id: string) => void
}

export function ExerciseList({ exercises, sets, last, reduced, currentId, onSelect }: Props) {
  return (
    <section aria-label="Ejercicios">
      <div className={styles.sectionHead}>
        <SectionLabel>Ejercicios</SectionLabel>
      </div>
      <ol className={styles.list}>
        {exercises.map((e, i) => {
          const done = completedSeries(e, sets)
          const target = targetSets(e, reduced)
          const prev = formatSets(e, last.get(e.id) ?? [])
          const isCurrent = e.id === currentId
          const body = (
            <>
              {isCurrent ? <BracketFrame active inset={4} /> : null}
              <span className={styles.index}>
                {String(i + 1).padStart(2, '0')}/{String(exercises.length).padStart(2, '0')}
              </span>
              <span className={styles.exText}>
                <span className={styles.exName}>{e.name}</span>
                <span className={styles.muted}>{repsLabel(e, reduced)}</span>
                {prev ? <span className={styles.muted}>Última vez: {prev}</span> : null}
              </span>
              <span className={styles.exState}>
                {done >= target ? (
                  <span className={styles.doneMark}>
                    <CheckMark />
                  </span>
                ) : onSelect && done > 0 ? (
                  `${done}/${target}`
                ) : null}
              </span>
            </>
          )
          return (
            <li key={e.id}>
              {onSelect ? (
                <button type="button" className={styles.exRow} onClick={() => onSelect(e.id)} aria-current={isCurrent ? 'step' : undefined}>
                  {body}
                </button>
              ) : (
                <div className={styles.exRow}>{body}</div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
