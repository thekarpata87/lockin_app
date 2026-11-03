import { ArrowRight } from 'lucide-react'
import styles from './ArrowCell.module.css'

type Props = { label: string; onClick: () => void; active?: boolean }

/** 1/4-width cell with an arrow. Orange with chamfer when active or pressed. */
export function ArrowCell({ label, onClick, active = false }: Props) {
  return (
    <button type="button" className={`${styles.cell} ${active ? styles.active : ''}`} onClick={onClick} aria-label={label}>
      <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
    </button>
  )
}
