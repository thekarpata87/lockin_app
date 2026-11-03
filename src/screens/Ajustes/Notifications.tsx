import { useState } from 'react'
import { Button } from '../../components/Button'
import { ChecklistRow } from '../../components/ChecklistRow'
import { useToast } from '../../components/Toast'
import { disablePush, enablePush, testPush, usePushStatus } from '../../sync/push'
import styles from './Ajustes.module.css'

const HINT: Record<string, string> = {
  unsupported: 'Este dispositivo no admite notificaciones web. En iPhone se necesita iOS 16.4 o más reciente.',
  needsInstall: 'Abre LOCK_IN desde el icono de tu pantalla de inicio para activarlas (en Safari no funcionan).',
  signedOut: 'Inicia sesión en Cuenta para activarlas; los avisos se envían desde tu Supabase.',
  denied: 'Las bloqueaste. Actívalas en Ajustes de iOS → Notificaciones → LOCK_IN.',
  off: 'Te avisa cuando termina el cardio, el descanso del gym o un temporizador del domingo, aunque la pantalla esté apagada.',
  on: 'Solo llegan si sales de la app o apagas la pantalla. Pueden tardar hasta 15 s.',
}

export function Notifications() {
  const toast = useToast()
  const status = usePushStatus()
  const [busy, setBusy] = useState(false)
  const can = status === 'on' || status === 'off'

  const toggle = async () => {
    setBusy(true)
    try {
      const s = status === 'on' ? await disablePush() : await enablePush()
      toast(s === 'on' ? 'Notificaciones activadas' : s === 'denied' ? 'Notificaciones bloqueadas en iOS' : 'Notificaciones desactivadas')
    } catch (e) {
      toast(`No se pudieron activar: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ChecklistRow
        label="Avisos con la pantalla apagada"
        detail={HINT[status]}
        checked={status === 'on'}
        onChange={() => {
          if (can && !busy) void toggle()
        }}
      />
      {status === 'on' ? (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            block
            onClick={() => {
              void testPush().then(() => toast('Prueba enviada. Bloquea el iPhone y espera unos segundos.'))
            }}
          >
            Enviar notificación de prueba
          </Button>
        </div>
      ) : null}
    </>
  )
}
