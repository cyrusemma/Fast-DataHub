import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mock/mockClient'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// MOCK MODE: when no real Supabase credentials are configured, DataHUB runs
// against a fully functional in-memory backend so every screen works offline.
// Drop real values into .env.local to switch to the live Supabase project.
export const IS_MOCK = !url || !anonKey || url.includes('your-project')

export const supabase = IS_MOCK
  ? mockSupabase
  : createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })

if (IS_MOCK && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info('%cDataHUB running in MOCK mode — using in-memory demo backend.', 'color:#0066FF;font-weight:600')
}
