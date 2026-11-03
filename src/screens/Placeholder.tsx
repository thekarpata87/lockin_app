import { ScreenHeader } from '../components/ScreenHeader'
import { SectionLabel } from '../components/SectionLabel'
import styles from './Placeholder.module.css'

export function Placeholder({ title, milestone }: { title: string; milestone: string }) {
  return (
    <>
      <ScreenHeader title={title} />
      <section className={styles.row}>
        <SectionLabel>En construcción</SectionLabel>
        <p className={styles.text}>Esta sección llega en el hito {milestone}.</p>
      </section>
    </>
  )
}
