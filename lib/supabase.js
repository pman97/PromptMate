// lib/supabase.js

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey) {
  console.warn('⚠️ Supabase public client env vars fehlen oder sind leer.', {
    NEXT_PUBLIC_SUPABASE_URL: !!url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anonKey,
  })
}
if (!serviceRoleKey) {
  console.warn('⚠️ Supabase SERVICE_ROLE_KEY fehlt.')
}

export const supabase = createClient(url || '', anonKey || '')
export const supabaseAdmin = createClient(url || '', serviceRoleKey || '')
