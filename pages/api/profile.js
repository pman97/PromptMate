import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  // Auth: JWT aus Authorization Header auslesen
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Nicht eingeloggt' })
  }

  // Nutzer-Info aus JWT holen
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return res.status(401).json({ error: 'Nicht eingeloggt' })
  }
  const userId = user.id

  if (req.method === 'GET') {
    // Profil holen
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, prompt_limit, prompts_used')
      .eq('user_id', userId)
      .single()
    if (error) {
      return res.status(200).json({ profile: null })
    }
    return res.status(200).json({ profile })
  }

  if (req.method === 'PATCH') {
    const { full_name } = req.body
    if (!full_name) {
      return res.status(400).json({ error: 'Name fehlt' })
    }
    // Upsert: Profil anlegen/aktualisieren
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ user_id: userId, full_name })
      .select('user_id, full_name, prompt_limit, prompts_used')
      .single()
    if (error) {
      return res.status(500).json({ error: 'Profil konnte nicht gespeichert werden.' })
    }
    return res.status(200).json({ profile })
  }

  res.status(405).json({ error: 'Nicht erlaubt' })
}
