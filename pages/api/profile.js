// pages/api/profile.js

import { createClient } from '@supabase/supabase-js'

// Normaler Client (für Lesen/Update via RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Admin-Client mit Service Role Key (umgeht RLS, Fallback für Erstellen/Schreiben)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getUserIdFromRequest(req) {
  // 1. Session aus Cookies
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session && session.user) {
    return session.user.id
  }

  // 2. Fallback: Bearer Token aus Header
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(token)

  if (userErr) {
    console.error('Fallback getUser failed:', userErr)
    return null
  }
  return user?.id || null
}

export default async function handler(req, res) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ error: 'Nicht eingeloggt' })
  }

  if (req.method === 'GET') {
    // Profil laden (normal, über RLS)
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, prompt_limit, prompts_used, user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Fehler beim Laden des Profils:', error)
      return res.status(500).json({ error: error.message })
    }

    if (!profile) {
      // Profil erstellen (Admin, um RLS zu umgehen)
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('profiles')
        .insert({ user_id: userId })
        .select()
        .maybeSingle()
      if (insertErr) {
        console.error('Profil anlegen fehlgeschlagen (Admin):', insertErr)
        return res.status(500).json({ error: insertErr.message })
      }
      profile = inserted
    }

    return res.status(200).json({ profile })
  }

  if (req.method === 'PATCH') {
    const { full_name } = req.body
    if (full_name === undefined) {
      return res.status(400).json({ error: 'Kein full_name übergeben' })
    }

    // Erst versuchen via normalem Client (RLS)
    let { data: updated, error: updateErr } = await supabase
      .from('profiles')
      .update({ full_name })
      .eq('user_id', userId)
      .maybeSingle()

    if (updateErr) {
      console.warn('Update via RLS fehlgeschlagen, versuche Fallback mit Admin:', updateErr)
    }

    if (!updated) {
      // Fallback: mit Admin-Client upserten (insert or update)
      const { data: upserted, error: upsertErr } = await supabaseAdmin
        .from('profiles')
        .upsert(
          { user_id: userId, full_name },
          { onConflict: 'user_id', ignoreDuplicates: false }
        )
        .select()
        .maybeSingle()
      if (upsertErr) {
        console.error('Fallback upsert fehlgeschlagen:', upsertErr)
        return res.status(500).json({ error: upsertErr.message })
      }
      updated = upserted
    }

    return res.status(200).json({ profile: updated })
  }

  res.setHeader('Allow', 'GET, PATCH')
  res.status(405).end()
}
