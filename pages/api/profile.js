// pages/api/profile.js

import { supabase, supabaseAdmin } from '../../lib/supabase'

async function getUserId(req) {
  // Bearer Token
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (token) {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)
    if (!error && user) return user.id
  }

  // Session aus Cookie
  const {
    data: { session },
    error: sessionError,
  } = await supabaseAdmin.auth.getSession()
  if (!sessionError && session?.user) {
    return session.user.id
  }

  return null
}

export default async function handler(req, res) {
  const userId = await getUserId(req)
  if (!userId) {
    return res.status(401).json({ error: 'Nicht eingeloggt' })
  }

  if (req.method === 'GET' || req.method === 'PATCH') {
    let full_name = undefined
    if (req.method === 'PATCH') {
      const { full_name: fn } = req.body || {}
      full_name = fn
    }

    const row = { user_id: userId }
    if (full_name !== undefined) row.full_name = full_name

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .upsert(row, { onConflict: 'user_id', returning: 'representation' })
      .select('full_name, prompt_limit, prompts_used, user_id')
      .maybeSingle()

    if (error) {
      console.error('Profil upsert failed:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ profile })
  }

  res.setHeader('Allow', 'GET, PATCH')
  res.status(405).end()
}
