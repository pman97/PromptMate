// lib/supabase.js

import { createClient } from '@supabase/supabase-js'

// Basic ENV checks (optional, aber hilfreich für Debugging)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey) {
  console.warn('⚠️ Supabase ENV Variablen fehlen! Bitte .env.local prüfen.')
}

// Public client (für Browser, User, RLS)
export const supabase = createClient(url, anonKey)

// Admin client (für Server-seitige API Routen)
export const supabaseAdmin = serviceRoleKey
  ? createClient(url, serviceRoleKey)
  : null  // Wirf KEINEN Fehler auf dem Client!
