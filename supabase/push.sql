-- LOCK_IN · Web Push (run once in the SQL Editor, or via the setup script).
-- Secrets are NOT in this file: the cron secret is stored in Vault by the setup step.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scheduled_pushes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tag text not null,
  send_at timestamptz not null,
  title text not null,
  body text not null,
  sent_at timestamptz,
  primary key (user_id, tag)
);
create index if not exists scheduled_pushes_due on public.scheduled_pushes (send_at) where sent_at is null;

alter table public.push_subscriptions enable row level security;
alter table public.scheduled_pushes enable row level security;
drop policy if exists "solo mis filas" on public.push_subscriptions;
drop policy if exists "solo mis filas" on public.scheduled_pushes;
create policy "solo mis filas" on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "solo mis filas" on public.scheduled_pushes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Every 15 s: ask the Edge Function to send what is due.
select cron.unschedule('lockin-send-pushes') where exists (select 1 from cron.job where jobname = 'lockin-send-pushes');
select cron.schedule(
  'lockin-send-pushes',
  '15 seconds',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'lockin_functions_url') || '/send-pushes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'lockin_push_cron_secret')
    ),
    body := '{}'::jsonb
  )
  where exists (select 1 from public.scheduled_pushes where sent_at is null and send_at <= now() + interval '15 seconds');
  $$
);

-- Housekeeping: drop sent rows older than a day.
select cron.unschedule('lockin-clean-pushes') where exists (select 1 from cron.job where jobname = 'lockin-clean-pushes');
select cron.schedule('lockin-clean-pushes', '0 4 * * *', $$ delete from public.scheduled_pushes where sent_at < now() - interval '1 day' $$);
