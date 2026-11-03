import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import type { GymDay } from '../../data/routines'
import { updateSettings } from '../../db/repo/settings'
import type { SetLog } from '../../db/schema'
import { defaultKg, logsWeight } from '../../lib/gym'
import { parseDecimal } from '../../lib/today'
import styles from './Gym.module.css'

type Props = {
  day: GymDay
  startWeights: Record<string, number>
  last: Map<string, SetLog[]>
}

/** Enter today's working weights once, so the first session doesn't start at defaults. */
export function StartWeights({ day, startWeights, last }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const list = day.exercises.filter(logsWeight)
  const noHistory = list.filter((e) => !(last.get(e.id) ?? []).length)
  const filled = noHistory.filter((e) => startWeights[e.id] !== undefined).length
  if (!noHistory.length) return null

  return (
    <>
      <button type="button" className={styles.linkRow} onClick={() => setOpen(true)}>
        <span className={styles.exText}>
          <span>Pesos iniciales</span>
          <span className={styles.muted}>
            {filled} de {noHistory.length} cargados · para que la primera serie ya tenga tu peso
          </span>
        </span>
        <span className={styles.count}>
          {filled}/{noHistory.length}
        </span>
      </button>
      <Sheet title={`Pesos iniciales · ${day.title.toLowerCase()}`} open={open} onClose={() => setOpen(false)}>
        <p className={styles.sheetNote}>El peso con el que trabajas hoy cada ejercicio. Solo se usa mientras no haya series registradas.</p>
        {noHistory.map((e) => (
          <WeightRow key={e.id} name={e.name} value={startWeights[e.id]} placeholder={defaultKg(e)} onSave={(v) => void updateSettings({ startWeights: { ...startWeights, [e.id]: v } })} />
        ))}
        <div className={styles.sheetPad}>
          <Button
            block
            onClick={() => {
              setOpen(false)
              toast('Pesos iniciales guardados')
            }}
          >
            Listo
          </Button>
        </div>
      </Sheet>
    </>
  )
}

function WeightRow({ name, value, placeholder, onSave }: { name: string; value: number | undefined; placeholder: number; onSave: (v: number) => void }) {
  const [draft, setDraft] = useState(value !== undefined ? String(value) : '')
  useEffect(() => {
    setDraft(value !== undefined ? String(value) : '')
  }, [value])
  return (
    <label className={styles.weightRow}>
      <span className={styles.weightName}>{name}</span>
      <span className={styles.weightInput}>
        <input
          type="text"
          inputMode="decimal"
          enterKeyHint="next"
          placeholder={String(placeholder)}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const n = parseDecimal(draft)
            if (n !== undefined && n >= 0 && n !== value) onSave(n)
          }}
        />
        <span className={styles.muted}>kg</span>
      </span>
    </label>
  )
}
