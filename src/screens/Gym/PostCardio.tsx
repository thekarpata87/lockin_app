import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '../../components/Button'
import { SectionLabel } from '../../components/SectionLabel'
import { Segmented } from '../../components/Segmented'
import { CARDIO_BY_ID, CARDIO_RULES } from '../../data/cardio'
import { cardioOn } from '../../db/repo/cardio'
import { unlockAudio } from '../../lib/audio'
import { startTimer } from '../../lib/timer'
import { setRun } from '../Casa/run'
import styles from './Gym.module.css'

/** After the session: start the post-gym cardio with the timer. */
export function PostCardio({ date }: { date: string }) {
  const [min, setMin] = useState<20 | 25>(20)
  const done = useLiveQuery(async () => (await cardioOn(date)).some((c) => c.kind === 'post'), [date])
  if (done !== false) return null
  const s = CARDIO_BY_ID.get('post')!
  return (
    <section aria-label="Cardio post-gym" className="anim-rise">
      <div className={styles.sectionHead}>
        <SectionLabel>Cardio post-gym</SectionLabel>
      </div>
      <p className={styles.note}>
        {s.description}. {CARDIO_RULES.zone2}
      </p>
      <Segmented
        label="Duración"
        options={[
          { value: 20, label: '20 min' },
          { value: 25, label: '25 min' },
        ]}
        value={min}
        onChange={(v) => setMin(v as 20 | 25)}
      />
      <div className={styles.actions}>
        <Button
          block
          onClick={() => {
            unlockAudio()
            setRun({ kind: 'post', minutes: min, date, state: startTimer(Date.now()) })
          }}
        >
          Iniciar cardio post-gym
        </Button>
      </div>
    </section>
  )
}
