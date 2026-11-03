import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '../../components/Button'
import { ChecklistRow } from '../../components/ChecklistRow'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { Segmented } from '../../components/Segmented'
import { Sheet } from '../../components/Sheet'
import { Stepper } from '../../components/Stepper'
import { useToast } from '../../components/Toast'
import { REDUCED_VOLUME_HINT, REST_OPTIONS_SEC } from '../../data/routines'
import { getSettings, updateSettings } from '../../db/repo/settings'
import { db } from '../../db/schema'
import type { SettingsData, Theme } from '../../db/schema'
import { BackupError, backupFileName, exportBackup, importBackup, needsBackupReminder, parseBackup } from '../../lib/backup'
import type { Backup } from '../../lib/backup'
import { daysBetween, fromISODate, today } from '../../lib/dates'
import { rampStep } from '../../lib/now'
import { parseDecimal } from '../../lib/today'
import { useSyncState } from '../../sync/engine'
import { Notifications } from './Notifications'
import styles from './Ajustes.module.css'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

export function Ajustes() {
  const navigate = useNavigate()
  const s = useLiveQuery(getSettings)
  if (!s) return <ScreenHeader title="AJUSTES" />
  const save = (patch: Partial<SettingsData>) => void updateSettings(patch)
  return (
    <>
      <div className={styles.backRow}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <ScreenHeader title="AJUSTES" />

      <Head>Perfil</Head>
      <TextField label="Estatura" unit="cm" value={s.heightCm} decimals={0} onSave={(v) => save({ heightCm: v })} />
      <TextField label="Peso meta" unit="kg" value={s.goalKg} decimals={1} onSave={(v) => save({ goalKg: v })} />
      <label className={styles.field}>
        <span>Fecha de inicio</span>
        <input className={styles.input} type="date" value={s.startDate ?? ''} onChange={(e) => e.target.value && save({ startDate: e.target.value })} />
      </label>

      <Head>Horarios</Head>
      <label className={styles.field}>
        <span>Despertar</span>
        <input className={styles.input} type="time" value={s.wakeTime} onChange={(e) => e.target.value && save({ wakeTime: e.target.value })} />
      </label>
      <label className={styles.field}>
        <span>Dormir</span>
        <input className={styles.input} type="time" value={s.sleepTime} onChange={(e) => e.target.value && save({ sleepTime: e.target.value })} />
      </label>
      <ChecklistRow
        label="Ajustar sueño gradualmente"
        detail={rampDetail(s)}
        checked={s.sleepRamp}
        onChange={(v) => save({ sleepRamp: v, sleepRampStart: v ? today() : null })}
      />

      <Head>Gym</Head>
      <p className={styles.caption}>Descanso entre series</p>
      <Segmented
        label="Descanso entre series"
        options={REST_OPTIONS_SEC.map((v) => ({ value: v, label: `${v} s` }))}
        value={s.restSec as (typeof REST_OPTIONS_SEC)[number]}
        onChange={(v) => save({ restSec: v })}
      />
      <ChecklistRow label="Volumen reducido" detail={`Los ejercicios de 5 series pasan a 4. ${REDUCED_VOLUME_HINT}`} checked={s.reducedVolume} onChange={(v) => save({ reducedVolume: v })} />
      <p className={styles.caption}>Creatina diaria</p>
      <Stepper label="Gramos de creatina" value={s.creatineG} onChange={(v) => save({ creatineG: v })} step={1} min={1} max={10} decimals={0} unit="g" inputMode="numeric" />

      <Head>Tema</Head>
      <Segmented label="Tema" options={THEMES} value={s.theme} onChange={(v) => save({ theme: v })} />

      <Head>Cuenta</Head>
      <AccountRow />

      <Head>Notificaciones</Head>
      <Notifications />

      <Head>Respaldo</Head>
      <BackupSection startDate={s.startDate} />

      <Head>Datos</Head>
      <DeleteAll />

      <p className={styles.version}>LOCK_IN · Versión {__APP_VERSION__}</p>
    </>
  )
}

function Head({ children }: { children: string }) {
  return (
    <div className={styles.sectionHead}>
      <SectionLabel>{children}</SectionLabel>
    </div>
  )
}

function rampDetail(s: SettingsData): string {
  if (!s.sleepRamp || !s.sleepRampStart) return 'Pasa de dormir cerca de las 00:00 a las 22:00 en 7 noches.'
  const step = rampStep(s, today())
  const night = daysBetween(s.sleepRampStart, today()) + 1
  return step ? `Noche ${night} de 7 · dormir ${step.sleep}, despertar ${step.wake}` : 'Terminado: ya sigues el horario normal.'
}

function TextField({ label, unit, value, decimals, onSave }: { label: string; unit: string; value: number; decimals: number; onSave: (v: number) => void }) {
  const [draft, setDraft] = useState(value.toFixed(decimals))
  useEffect(() => {
    setDraft(value.toFixed(decimals))
  }, [value, decimals])
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <span className={styles.inputWrap}>
        <input
          className={`${styles.input} ${styles.num}`}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const n = parseDecimal(draft)
            if (n !== undefined && n > 0 && n !== value) onSave(Number(n.toFixed(decimals)))
            else setDraft(value.toFixed(decimals))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
        <span className={styles.unit}>{unit}</span>
      </span>
    </label>
  )
}

const STATUS: Record<string, string> = {
  idle: 'Sincronizado',
  syncing: 'Sincronizando',
  offline: 'Sin conexión',
  error: 'Error al sincronizar',
  signedOut: 'Sin sesión',
  disabled: 'Sin configurar',
}

function AccountRow() {
  const sync = useSyncState()
  return (
    <Link to="/cuenta" className={styles.linkRow}>
      <span className={styles.linkText}>
        <span>Cuenta y sincronización</span>
        <span className={styles.muted}>
          {STATUS[sync.status]}
          {sync.pending ? ` · ${sync.pending} pendientes` : ''}
        </span>
      </span>
      <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
    </Link>
  )
}

function BackupSection({ startDate }: { startDate: string | null }) {
  const toast = useToast()
  const sync = useSyncState()
  const lastBackupAt = useLiveQuery(async () => ((await db.meta.get('lastBackupAt'))?.value as number | undefined) ?? null)
  const file = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const since = startDate ? fromISODate(startDate).getTime() : Date.now()
  const remind = lastBackupAt !== undefined && needsBackupReminder(sync.lastSyncAt, lastBackupAt, Date.now(), since)

  const doExport = async () => {
    const b = await exportBackup()
    const name = backupFileName()
    const blob = new Blob([JSON.stringify(b, null, 1)], { type: 'application/json' })
    const f = new File([blob], name, { type: 'application/json' })
    try {
      // iOS: the share sheet lets you save it to Archivos.
      if (navigator.canShare?.({ files: [f] })) {
        await navigator.share({ files: [f], title: name })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      }
      await db.meta.put({ key: 'lastBackupAt', value: Date.now() })
      toast('Respaldo exportado')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast('No se pudo exportar el respaldo')
    }
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setError(null)
    try {
      setPending(parseBackup(await f.text()))
    } catch (e) {
      setError(e instanceof BackupError ? e.message : 'No se pudo leer el archivo.')
    }
    if (file.current) file.current.value = ''
  }

  const count = pending ? Object.values(pending.tables).reduce((n, rows) => n + (rows?.length ?? 0), 0) : 0

  return (
    <>
      {remind ? <p className={styles.warn}>Llevas más de 30 días sin sincronizar ni respaldar. Exporta un respaldo para no perder tus registros.</p> : null}
      <div className={styles.actions}>
        <Button variant="secondary" block onClick={() => void doExport()}>
          Exportar respaldo
        </Button>
        <Button variant="secondary" block onClick={() => file.current?.click()}>
          Importar respaldo
        </Button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        {error ? <p className={styles.errorText}>{error}</p> : null}
        <p className={styles.muted}>El respaldo es un archivo JSON con todos tus registros. Guárdalo en Archivos o iCloud.</p>
      </div>
      <Sheet title="Importar respaldo" open={pending !== null} onClose={() => setPending(null)}>
        <div className={styles.sheetPad}>
          <p>
            El archivo tiene {count} registros{pending?.exportedAt ? `, exportados el ${pending.exportedAt.slice(0, 10)}` : ''}.
          </p>
          <p className={styles.muted}>Si un registro ya existe en el iPhone, se conserva el más reciente. Lo importado se sube a tu cuenta en la siguiente sincronización.</p>
          <Button
            block
            onClick={async () => {
              if (!pending) return
              const r = await importBackup(pending)
              setPending(null)
              toast(`Respaldo importado: ${r.added} nuevos, ${r.updated} actualizados`)
            }}
          >
            Importar
          </Button>
        </div>
      </Sheet>
    </>
  )
}

function DeleteAll() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const ok = text.trim() === 'BORRAR'
  const wipe = async () => {
    await db.delete()
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith('bloque.')) localStorage.removeItem(k)
    } catch {
      // ignore
    }
    location.replace(location.pathname + '#/hoy')
    location.reload()
  }
  return (
    <>
      <div className={styles.actions}>
        <Button variant="secondary" block className={styles.danger} onClick={() => setOpen(true)}>
          Borrar datos de este iPhone
        </Button>
      </div>
      <Sheet
        title="Borrar datos de este iPhone"
        open={open}
        onClose={() => {
          setOpen(false)
          setText('')
        }}
      >
        <div className={styles.sheetPad}>
          <p>Se borran todos los registros, planes y ajustes guardados en este iPhone, y se cierra la sesión.</p>
          <p className={styles.muted}>Lo que ya se sincronizó sigue en Supabase y vuelve a bajar si inicias sesión. Lo pendiente de subir se pierde; exporta un respaldo antes si lo necesitas.</p>
          <label className={styles.fieldCol}>
            <span className={styles.muted}>Escribe BORRAR para confirmar</span>
            <input className={styles.input} type="text" autoCapitalize="characters" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <Button variant="inverse" block disabled={!ok} onClick={() => void wipe()}>
            Borrar todo
          </Button>
        </div>
      </Sheet>
    </>
  )
}
