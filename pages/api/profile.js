// pages/api/profile.js

import { createClient } from '@supabase/supabase-js'

// Nur Admin-Client: upsert & read, um Profil immer zurückzugeben
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Hilfsfunktion: extrahiere user id aus Authorization Bearer Token oder Cookie-Session
async function getUserId(req) {
  // Versuche Bearer Token
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (token) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (!error && user) return user.id
  }

  // Fallback: Session aus Cookie (funktioniert nur wenn Request vom Browser mit Cookie kommt)
  const {
    data: { session },
    error: sessionError,
  } = await supabaseAdmin.auth.getSession()
  if (!sessionError && session && session.user) {
    return session.user.id
  }

  return null
}

export default async function handler(req, res) {
  const userId = await getUserId(req)
  if (!userId) {
    return res.status(401).json({ error: 'Nicht eingeloggt' })
  }

  // GET und PATCH behandeln fast gleich: wir wollen ein Profil sicherstellen
  if (req.method === 'GET' || req.method === 'PATCH') {
    let full_name = undefined
    if (req.method === 'PATCH') {
      const body = await new Promise((r) => {
        let d = ''
        req.on('data', (chunk) => (d += chunk))
        req.on('end', () => r(JSON.parse(d)))
      })
      full_name = body.full_name
    }

    // Upsert mit optionalem full_name
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
