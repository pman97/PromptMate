// lib/supabase.js

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(url, anonKey)

export const supabaseAdmin =
  serviceRoleKey
    ? createClient(url, serviceRoleKey)
    : null // Wird serverseitig benutzt!

if (!url || !anonKey) {
  console.warn('[Supabase] Fehlende ENV Variablen!')
}
