import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Session } from '@supabase/supabase-js'
import { Button } from '../../components/Button'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { useToast } from '../../components/Toast'
import { afterSignIn, afterSignOut, syncNow, useSyncState } from '../../sync/engine'
import { supabase } from '../../sync/supabase'
import styles from './Cuenta.module.css'

const STATUS_TEXT: Record<string, string> = {
  idle: 'Sincronizado',
  syncing: 'Sincronizando…',
  offline: 'Sin conexión. Tus registros están guardados en el iPhone y se subirán cuando abras la app con señal.',
  error: 'Error al sincronizar.',
  signedOut: 'Inicia sesión para sincronizar. La app sigue funcionando sin cuenta.',
  disabled: 'La sincronización no está configurada en esta versión.',
}

function loginError(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.'
  if (/email not confirmed/i.test(msg)) return 'Confirma tu correo en Supabase antes de entrar.'
  if (/fetch|network|load failed/i.test(msg)) return 'Sin conexión. Intenta de nuevo cuando tengas señal.'
  return msg
}

export function Cuenta() {
  const navigate = useNavigate()
  const toast = useToast()
  const sync = useSyncState()
  const [session, setSession] = useState<Session | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoaded(true)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoaded(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (err) {
      setError(loginError(err.message))
      return
    }
    setPassword('')
    toast('Sesión iniciada')
    void afterSignIn()
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    await afterSignOut()
    toast('Sesión cerrada')
  }

  const last = sync.lastSyncAt ? format(new Date(sync.lastSyncAt), "d MMM, HH:mm", { locale: es }) : 'Nunca'

  return (
    <>
      <div className={styles.backRow}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <ScreenHeader title="CUENTA" />

      <section className={styles.block}>
        <SectionLabel>Sincronización</SectionLabel>
        <p className={styles.status}>{STATUS_TEXT[sync.status] ?? sync.status}</p>
        {sync.status === 'error' && sync.lastError ? <p className={styles.errorText}>{sync.lastError}</p> : null}
      </section>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.number}>{sync.pending}</span>
          <span className={styles.muted}>{sync.pending === 1 ? 'registro pendiente' : 'registros pendientes'}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.lastValue}>{last}</span>
          <span className={styles.muted}>Última sincronización</span>
        </div>
      </div>

      {!supabase ? null : !loaded ? null : session ? (
        <section className={styles.block}>
          <SectionLabel>Sesión</SectionLabel>
          <p className={styles.email}>{session.user.email}</p>
          <div className={styles.actions}>
            <Button block disabled={sync.status === 'syncing'} onClick={() => void syncNow()}>
              Sincronizar ahora
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              Cerrar sesión
            </Button>
          </div>
        </section>
      ) : (
        <form className={styles.block} onSubmit={(e) => void signIn(e)}>
          <SectionLabel>Iniciar sesión</SectionLabel>
          <p className={styles.muted}>Inicia sesión aquí, en la app instalada. Safari y la app guardan sus datos por separado.</p>
          <label className={styles.field}>
            <span className={styles.muted}>Correo</span>
            <input className={styles.input} type="email" autoComplete="username" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.muted}>Contraseña</span>
            <input className={styles.input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error ? <p className={styles.errorText}>{error}</p> : null}
          <Button type="submit" block disabled={busy}>
            {busy ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>
      )}
    </>
  )
}
