// supabase-js adapter for the sync engine.
import type { PostgrestError } from '@supabase/supabase-js'
import { SyncError } from './engine'
import type { Remote } from './engine'
import type { RemoteRow } from './mapping'
import { supabase } from './supabase'

function classify(error: PostgrestError | Error | null, status?: number): SyncError {
  const msg = error?.message ?? 'Error desconocido'
  if (status === 0 || /Failed to fetch|NetworkError|Load failed|network/i.test(msg)) return new SyncError(msg, 'network')
  if (status === 401 || status === 403 || (error && 'code' in error && /^(PGRST301|PGRST302|42501)$/.test(error.code))) {
    return new SyncError(msg, 'auth')
  }
  return new SyncError(msg, 'other')
}

export function supabaseRemote(): Remote | null {
  const sb = supabase
  if (!sb) return null
  return {
    async userId() {
      const { data } = await sb.auth.getSession()
      return data.session?.user.id ?? null
    },
    async refresh() {
      const { data, error } = await sb.auth.refreshSession()
      return !error && !!data.session
    },
    async upsert(table, rows, onConflict) {
      try {
        const { error, status } = await sb.from(table).upsert(rows, { onConflict })
        if (error) throw classify(error, status)
      } catch (e) {
        throw e instanceof SyncError ? e : classify(e as Error)
      }
    },
    async pull(table, cursor, offset, limit) {
      try {
        let q = sb.from(table).select('*').order('server_updated_at', { ascending: true }).range(offset, offset + limit - 1)
        if (cursor) q = q.gte('server_updated_at', cursor)
        const { data, error, status } = await q
        if (error) throw classify(error, status)
        return (data ?? []) as RemoteRow[]
      } catch (e) {
        throw e instanceof SyncError ? e : classify(e as Error)
      }
    },
  }
}
