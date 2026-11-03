// LOCK_IN · sends due Web Push notifications. Called by pg_cron every 15 s.
// Secrets (Supabase → Edge Functions → Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_CRON_SECRET.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUBJECT = 'https://thekarpata87.github.io/lockin_app/'

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('PUSH_CRON_SECRET')) {
    return new Response('forbidden', { status: 403 })
  }
  webpush.setVapidDetails(SUBJECT, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  // Send a little early so a 15 s cron is never late by more than one tick.
  const { data: due, error } = await sb
    .from('scheduled_pushes')
    .select('user_id, tag, title, body')
    .is('sent_at', null)
    .lte('send_at', new Date(Date.now() + 5_000).toISOString())
    .limit(100)
  if (error) return new Response(error.message, { status: 500 })

  let sent = 0
  for (const p of due ?? []) {
    // Claim the row first so overlapping runs never send twice.
    const { data: claimed } = await sb
      .from('scheduled_pushes')
      .update({ sent_at: new Date().toISOString() })
      .eq('user_id', p.user_id)
      .eq('tag', p.tag)
      .is('sent_at', null)
      .select('tag')
    if (!claimed?.length) continue

    const { data: subs } = await sb.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', p.user_id)
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: p.title, body: p.body, tag: p.tag }),
          { TTL: 300, urgency: 'high' },
        )
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        else console.error('push failed', code, (e as Error).message)
      }
    }
  }
  return Response.json({ due: due?.length ?? 0, sent })
})
