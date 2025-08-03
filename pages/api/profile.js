// pages/api/profile.js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // Session aus Cookie holen
  let userId = null
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (session && session.user) {
    userId = session.user.id
  } else {
    // Fallback: Bearer token aus Header nehmen
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (token) {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser(token)
      if (user && user.id) {
        userId = user.id
      } else {
        console.error('Fallback getUser fehlgeschlagen:', userErr)
      }
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Nicht eingeloggt' })
  }

  if (req.method === 'GET') {
    // Profil laden oder anlegen
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, prompt_limit, prompts_used')
      .eq('user_id', userId)
      .single()

    if ((!profile && error) || !profile) {
      // Wenn nicht existent, erstellen
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
