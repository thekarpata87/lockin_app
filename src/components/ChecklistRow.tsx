import type { ReactNode } from 'react'
import { CheckMark } from './CheckMark'
import styles from './ChecklistRow.module.css'

type Props = { label: string; detail?: ReactNode; checked: boolean; onChange: (v: boolean) => void }

export function ChecklistRow({ label, detail, checked, onChange }: Props) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className={styles.row} onClick={() => onChange(!checked)}>
      <span className={styles.text}>
        <span>{label}</span>
        {detail ? <span className={styles.detail}>{detail}</span> : null}
      </span>
      <span className={`${styles.box} ${checked ? styles.on : ''}`}>{checked ? <CheckMark size={22} /> : null}</span>
    </button>
  )
}
