// Supabase client. Only the public URL and publishable key ever reach the client.
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Accepts "https://x.supabase.co", with or without a trailing "/rest/v1/". */
export function normalizeSupabaseUrl(url: string | undefined): string | null {
  if (!url) return null
  const clean = url.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '').replace(/\/+$/, '')
  return /^https:\/\/[^/]+$/.test(clean) ? clean : null
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined)
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'bloque.auth' },
      })
    : null
