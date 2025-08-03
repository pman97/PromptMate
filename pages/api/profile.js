// pages/api/profile.js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
    // Profil laden (wenn nicht vorhanden: null, kein Fehler)
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
      // Profil anlegen
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert({ user_id: userId })
        .select()
        .maybeSingle()
      if (insertErr) {
        console.error('Profil anlegen fehlgeschlagen:', insertErr)
        return res.status(500).json({ error: insertErr.message })
      }
      profile = inserted
    }

    return res.status(200).json({ profile })
  }

  if (req.method === 'PATCH') {
    const { full_name } = req.body
    const updates = {}
    if (full_name !== undefined) updates.full_name = full_name

    const { data, error: updateErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .maybeSingle()

    if (updateErr) {
      console.error('Fehler beim Aktualisieren des Profils:', updateErr)
      return res.status(500).json({ error: updateErr.message })
    }
    return res.status(200).json({ profile: data })
  }

  res.setHeader('Allow', 'GET, PATCH')
  res.status(405).end()
}
