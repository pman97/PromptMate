// lib/supabase.js

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Debug / Diagnose (nur zur Entwicklung; kannst du später entfernen)
if (typeof window === 'undefined') {
  // Server-side
  if (!url || !anonKey) {
    console.warn('⚠️ Supabase public client env vars fehlen oder sind leer.', {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anonKey,
    })
  }
  if (!serviceRoleKey) {
    console.warn('⚠️ Supabase SERVICE_ROLE_KEY fehlt. Admin-Operationen werden fehlschlagen.')
  }
} else {
  // Client-side
  if (!url || !anonKey) {
    console.warn('⚠️ (Client) Supabase public client env vars fehlen oder sind leer.', {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anonKey,
    })
  }
}

// Öffentlicher Client (für Browser / RLS-konforme Zugriffe)
export const supabase = createClient(url, anonKey)

/**
 * Hole den Admin-Client. 
 * Wir erstellen ihn *nicht* automatisch, wenn der Service Role Key fehlt,
 * weil das sonst sofort den Fehler "supabaseKey is required" wirft.
 * Verwende das *nur* in serverseitigen Kontexten (API routes).
 */
export function getSupabaseAdmin() {
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt. Admin-Client kann nicht erstellt werden.'
    )
  }
  return createClient(url, serviceRoleKey)
}
