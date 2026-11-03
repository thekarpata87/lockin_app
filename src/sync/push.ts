// Web Push (iOS 16.4+, installed app). Each alarm is scheduled on the server as soon as it starts
// (while the app is open, so the request always gets out). If you are still looking at the app
// near the end, it cancels the push ~20 s before, so notifications only arrive when the phone is
// locked or you're in another app. The server sends them (Edge Function + pg_cron every 15 s).
import { useSyncExternalStore } from 'react'
import { normalizeSupabaseUrl, supabase } from './supabase'

/** Public by design; the private key lives only in Supabase secrets. */
export const VAPID_PUBLIC_KEY = 'BIWMDWmKajFFOBYNfTZAMZ45sL5PHRf3bG4Uluj0Z_Bj6UglaoTLoElAgPtv_VdUHW419LVG-0Tuokbf4MzWHX0'

const URL_BASE = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined)
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
const ENABLED_KEY = 'bloque.push'

export type PushStatus = 'unsupported' | 'needsInstall' | 'signedOut' | 'denied' | 'off' | 'on'

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function readEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

// ---- session cache: needed synchronously when the page is being hidden ----
let session: { token: string; userId: string } | null = null
let status: PushStatus = 'off'
const subs = new Set<() => void>()
const emit = () => subs.forEach((s) => s())

async function computeStatus(): Promise<PushStatus> {
  if (!supported()) return isStandalone() ? 'unsupported' : 'needsInstall'
  if (!isStandalone()) return 'needsInstall'
  if (!supabase || !session) return 'signedOut'
  if (Notification.permission === 'denied') return 'denied'
  if (!readEnabled() || Notification.permission !== 'granted') return 'off'
  const reg = await navigator.serviceWorker.ready
  return (await reg.pushManager.getSubscription()) ? 'on' : 'off'
}

async function refresh() {
  status = await computeStatus()
  emit()
}

export function usePushStatus(): PushStatus {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => status,
  )
}

function urlB64ToUint8Array(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Must be called from a tap (iOS requirement). */
export async function enablePush(): Promise<PushStatus> {
  if (!supabase || !session) return refreshAndGet()
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return refreshAndGet()
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) }))
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: json.endpoint, user_id: session.userId, p256dh: json.keys.p256dh, auth: json.keys.auth }, { onConflict: 'endpoint' })
  if (error) throw new Error(error.message)
  try {
    localStorage.setItem(ENABLED_KEY, '1')
  } catch {
    // ignore
  }
  const st = await refreshAndGet()
  for (const [tag, a] of alarms) onAlarm(tag, a)
  return st
}

export async function disablePush(): Promise<PushStatus> {
  try {
    localStorage.removeItem(ENABLED_KEY)
  } catch {
    // ignore
  }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    if (supabase) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
  return refreshAndGet()
}

async function refreshAndGet() {
  await refresh()
  return status
}

import { alarms, onAlarmChange } from './alarms'
import type { Alarm } from './alarms'

function rest(path: string, init: RequestInit) {
  if (!URL_BASE || !KEY || !session) return
  return fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    keepalive: true,
    headers: { apikey: KEY, Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  }).catch(() => undefined)
}

/** The server may send up to ~5 s early and runs every 15 s; cancel with margin. */
const CANCEL_BEFORE_MS = 20_000
const cancelTimers = new Map<string, number>()
const active = () => status === 'on' && !!session && !!supabase

const row = (tag: string, a: Alarm) => ({
  user_id: session!.userId,
  tag,
  send_at: new Date(a.at).toISOString(),
  title: a.title,
  body: a.body,
  sent_at: null,
})

async function schedule(tag: string, a: Alarm) {
  if (!active()) return
  await supabase!.from('scheduled_pushes').upsert(row(tag, a), { onConflict: 'user_id,tag' })
}

async function cancel(tag: string) {
  if (!session || !supabase) return
  await supabase.from('scheduled_pushes').delete().eq('user_id', session.userId).eq('tag', tag).is('sent_at', null)
}

/** While visible near the end, the in-app beep is enough: drop the push. */
function armCancel(tag: string, a: Alarm) {
  window.clearTimeout(cancelTimers.get(tag))
  const wait = a.at - CANCEL_BEFORE_MS - Date.now()
  cancelTimers.set(
    tag,
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') void cancel(tag)
    }, Math.max(0, wait)),
  )
}

function onAlarm(tag: string, a: Alarm | null) {
  window.clearTimeout(cancelTimers.get(tag))
  if (!a) {
    void cancel(tag)
    return
  }
  if (a.at - Date.now() <= CANCEL_BEFORE_MS) return // too close to be useful
  void schedule(tag, a)
  armCancel(tag, a)
}

/** Backup: when the app is hidden, (re)send every alarm still ahead. */
function onHidden() {
  if (!active()) return
  const now = Date.now()
  const rows = [...alarms.entries()].filter(([, a]) => a.at > now + 2000).map(([tag, a]) => row(tag, a))
  if (!rows.length) return
  void rest('scheduled_pushes?on_conflict=user_id,tag', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) })
}

/** Back in the app: drop what is about to fire, re-arm the rest. */
function onVisible() {
  if (!active()) return
  const now = Date.now()
  for (const [tag, a] of alarms) {
    if (a.at - now <= CANCEL_BEFORE_MS) void cancel(tag)
    else armCancel(tag, a)
  }
}

/** Send a test notification in ~15 s (lock the phone to see it). */
export async function testPush(): Promise<void> {
  if (!supabase || !session) return
  await supabase
    .from('scheduled_pushes')
    .upsert(
      { user_id: session.userId, tag: 'test', send_at: new Date(Date.now() + 5000).toISOString(), title: 'LOCK_IN', body: 'Así se ven tus avisos. Bloquea el iPhone para recibirlos.', sent_at: null },
      { onConflict: 'user_id,tag' },
    )
}

export function startPush() {
  if (!supabase) return
  const setSession = (s: { access_token: string; user: { id: string } } | null) => {
    session = s ? { token: s.access_token, userId: s.user.id } : null
    void refresh()
  }
  void supabase.auth.getSession().then(({ data }) => setSession(data.session))
  supabase.auth.onAuthStateChange((_e, s) => setSession(s))
  onAlarmChange(onAlarm)
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'hidden' ? onHidden() : onVisible()))
  window.addEventListener('pagehide', onHidden)
}
