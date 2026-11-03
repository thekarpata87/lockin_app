import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'inverse' | 'ghost'
  block?: boolean
}

export function Button({ variant = 'primary', block = false, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={`${styles.btn} ${styles[variant]} ${block ? styles.block : ''} ${className ?? ''}`} {...rest} />
}
