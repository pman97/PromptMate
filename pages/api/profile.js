// pages/api/profile.js

import { createClient } from '@supabase/supabase-js'

// Normaler Client (für Lesen/Update via RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Admin-Client mit Service Role Key (umgeht RLS)
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

  // 2. Fallback: Bearer Token
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

async function fetchExistingProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, prompt_limit, prompts_used, user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return profile
}

export default async function handler(req, res) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ error: 'Nicht eingeloggt' })
  }

  if (req.method === 'GET') {
    // Profil laden (via RLS)
    let profile = null
    try {
      profile = await fetchExistingProfile(userId)
    } catch (e) {
      console.error('Fehler beim Laden des Profils:', e)
      return res.status(500).json({ error: e.message })
    }

    if (!profile) {
      // Profil anlegen mit upsert, aber duplicate key abfangen
      try {
        const { data: upserted, error: upsertErr } = await supabaseAdmin
          .from('profiles')
          .upsert(
            { user_id: userId },
            { onConflict: 'user_id', returning: 'representation' }
          )
          .maybeSingle()
        if (upsertErr) {
          // Wenn es ein Duplicate-Key-Error ist, einfach das bestehende holen
          if (upsertErr.code === '23505') {
            profile = await fetchExistingProfile(userId)
          } else {
            console.error('Profil upserten fehlgeschlagen (Admin):', upsertErr)
            return res.status(500).json({ error: upsertErr.message })
          }
        } else {
          profile = upserted
        }
      } catch (e) {
        // Fallback: falls trotzdem conflict oder anderes, nochmal lesen
        console.warn('Upsert war problematisch, versuche erneut zu lesen:', e)
        try {
          profile = await fetchExistingProfile(userId)
        } catch (e2) {
          console.error('Failed to recover profile after upsert failure:', e2)
          return res.status(500).json({ error: e2.message })
        }
      }
    }

    return res.status(200).json({ profile })
  }

  if (req.method === 'PATCH') {
    const { full_name } = req.body
    if (full_name === undefined) {
      return res.status(400).json({ error: 'Kein full_name übergeben' })
    }

    // Erst normales Update versuchen (RLS)
    let updated = null
    try {
      const { data, error: updateErr } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('user_id', userId)
        .maybeSingle()
      if (updateErr) {
        console.warn('Update via RLS fehlgeschlagen, fallback später', updateErr)
      } else {
        updated = data
      }
    } catch (e) {
      console.warn('RLS-update exception, fallback:', e)
    }

    if (!updated) {
      // Fallback: upsert mit Admin (setzt full_name)
      try {
        const { data: upserted, error: upsertErr } = await supabaseAdmin
          .from('profiles')
          .upsert(
            { user_id: userId, full_name },
            { onConflict: 'user_id', returning: 'representation' }
          )
          .maybeSingle()
        if (upsertErr) {
          console.error('Fallback upsert fehlgeschlagen:', upsertErr)
          return res.status(500).json({ error: upsertErr.message })
        }
        updated = upserted
      } catch (e) {
        console.error('Fallback upsert exception:', e)
        return res.status(500).json({ error: e.message })
      }
    }

    return res.status(200).json({ profile: updated })
  }

  res.setHeader('Allow', 'GET, PATCH')
  res.status(405).end()
}
