import styles from './CardTab.module.css'

/** Tag attached to a card's top-left edge (DESIGN §6). */
export function CardTab({ children, active = false }: { children: string; active?: boolean }) {
  return <span className={`${styles.tab} ${active ? styles.active : ''}`}>{children}</span>
}

export function CardTabs({ tags }: { tags: string[] }) {
  return (
    <span className={styles.row}>
      {tags.map((t, i) => (
        <CardTab key={t} active={i === 0}>
          {t}
        </CardTab>
      ))}
    </span>
  )
}
