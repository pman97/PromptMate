// pages/api/profile.js

import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  // Session aus dem Supabase-Cookie holen
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Session error:', sessionError)
  }

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Nicht eingeloggt' })
  }

  const userId = session.user.id

  if (req.method === 'GET') {
    // Versuch, das Profil zu laden
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, prompt_limit, prompts_used')
      .eq('user_id', userId)
      .single()

    // Wenn kein Profil existiert, automatisch anlegen
    if ((error && error.code === 'PGRST116') || !profile) {
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert({ user_id: userId })
        .select()
        .single()
      if (insertErr) {
        console.error('Profil anlegen fehlgeschlagen:', insertErr)
        return res.status(500).json({ error: insertErr.message })
      }
      profile = inserted
      error = null
    }

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ profile })
  }

  if (req.method === 'PATCH') {
    const { full_name } = req.body
    const updates = {}
    if (full_name !== undefined) updates.full_name = full_name

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json({ profile: data })
  }

  res.setHeader('Allow', 'GET, PATCH')
  res.status(405).end()
}
