// lib/supabase.js

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Diagnose-Warnung (nur beim Server-Build/Dev)
if (!url || !anonKey) {
  console.warn(
    '⚠️ Supabase public client env vars fehlen oder sind leer.',
    { NEXT_PUBLIC_SUPABASE_URL: !!url, NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anonKey }
  )
}
if (!serviceRoleKey) {
  console.warn('⚠️ Supabase SERVICE_ROLE_KEY fehlt.')
}

// Öffentlicher Client (RLS, im Browser benutzt)
export const supabase = createClient(url || '', anonKey || '')

// Admin-Client (serverseitig; umgeht RLS)
export const supabaseAdmin = createClient(url || '', serviceRoleKey || '')
