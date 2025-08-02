// pages/api/profile.js
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  // Auth über Supabase-Cookie
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return res.status(401).json({ error: 'Nicht eingeloggt' })

  const userId = session.user.id

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, prompt_limit, prompts_used')
      .eq('user_id', userId)
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ profile: data })
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

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ profile: data })
  }

  res.setHeader('Allow', 'GET,PATCH')
  res.status(405).end()
}
