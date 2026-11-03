import { ScreenHeader } from '../../components/ScreenHeader'
import { SectionLabel } from '../../components/SectionLabel'
import styles from './Hoy.module.css'

/** M1: shell only. The font check verifies accented capitals in Tektur offline (DESIGN §3). */
export function Hoy() {
  return (
    <>
      <ScreenHeader title="HOY" />
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.number}>001</span>
          <span className={styles.label}>Día del plan</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.number}>—</span>
          <span className={styles.label}>kg hoy</span>
        </div>
      </div>
      <section className={styles.row}>
        <SectionLabel>Prueba de fuentes</SectionLabel>
        <p className={`display ${styles.check}`}>MIÉRCOLES CENA COLACIÓN AÑADIR SÁBADO</p>
        <p className={styles.mono}>Colación · Comida · Último día · ¿Señal? 0123456789</p>
      </section>
      <section className={styles.row}>
        <SectionLabel>En construcción</SectionLabel>
        <p className={styles.muted}>Las comidas, el agua y los hábitos llegan en el hito M3.</p>
      </section>
      <p className={styles.version}>Versión {__APP_VERSION__}</p>
    </>
  )
}
