import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../components/Button'
import { Sheet } from '../../components/Sheet'
import { Stepper } from '../../components/Stepper'
import { useToast } from '../../components/Toast'
import { PROFILE } from '../../data/profile'
import { WEIGH_IN_GUIDE } from '../../data/rules'
import { saveBodyMetric } from '../../db/repo/bodyMetrics'
import type { BodyMetric } from '../../db/schema'
import { parseDecimal } from '../../lib/today'
import styles from './Hoy.module.css'

type Props = {
  date: string
  planDay: number | null
  today: BodyMetric | undefined
  latest: BodyMetric | undefined
  celebrating: boolean
  dayComplete: boolean
}

/** The protagonist block of HOY: plan day and today's weight (with corner ■ markers). */
export function HeroStats({ date, planDay, today, latest, celebrating, dayComplete }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className={`${styles.hero} ${celebrating ? styles.celebrate : ''} ${dayComplete ? styles.heroDone : ''}`}>
        <span className={`${styles.mk} ${styles.mkTl}`} aria-hidden="true" />
        <span className={`${styles.mk} ${styles.mkTr}`} aria-hidden="true" />
        <span className={`${styles.mk} ${styles.mkBl}`} aria-hidden="true" />
        <span className={`${styles.mk} ${styles.mkBr}`} aria-hidden="true" />
        <div className={styles.stat}>
          <span className={styles.number}>{planDay === null ? '—' : String(planDay).padStart(3, '0')}</span>
          <span className={styles.label}>Día del plan</span>
        </div>
        <button type="button" className={`${styles.stat} ${styles.weightBtn}`} onClick={() => setOpen(true)} aria-label="Registrar peso de hoy">
          <span className={styles.number}>{today?.weightKg?.toFixed(1) ?? '—'}</span>
          <span className={styles.label}>kg hoy</span>
          <span className={styles.plus} aria-hidden="true">
            <Plus size={20} strokeWidth={1.5} />
          </span>
        </button>
      </div>
      <Sheet title="Peso de hoy" open={open} onClose={() => setOpen(false)}>
        {open ? <WeightForm date={date} today={today} latest={latest} onDone={() => setOpen(false)} /> : null}
      </Sheet>
    </>
  )
}

function WeightForm({ date, today, latest, onDone }: { date: string; today?: BodyMetric; latest?: BodyMetric; onDone: () => void }) {
  const toast = useToast()
  const [kg, setKg] = useState(today?.weightKg ?? latest?.weightKg ?? PROFILE.startWeightKg)
  const [waist, setWaist] = useState(today?.waistCm !== undefined ? String(today.waistCm) : '')
  const save = async () => {
    const waistCm = parseDecimal(waist)
    await saveBodyMetric(date, { weightKg: kg, ...(waistCm !== undefined ? { waistCm } : {}) })
    toast('Peso guardado')
    onDone()
  }
  return (
    <div className={styles.form}>
      <Stepper label="Peso en kg" value={kg} onChange={setKg} step={0.1} min={30} max={250} decimals={1} unit="kg" />
      <label className={styles.field}>
        <span className={styles.label}>Cintura en cm (opcional, cada 2 semanas)</span>
        <input className={styles.input} type="text" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="—" />
      </label>
      <p className={styles.note}>{WEIGH_IN_GUIDE}</p>
      <div className={styles.formActions}>
        <Button block onClick={() => void save()}>
          Guardar peso
        </Button>
      </div>
    </div>
  )
}
