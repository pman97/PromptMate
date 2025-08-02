// pages/api/generate.js

import { supabaseAdmin } from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' })
  }

  const { prompt, userId } = req.body
  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Fehlender prompt oder userId' })
  }

  try {
    // MOCK‑Antwort
    const text = 'Dies ist eine Testantwort (Mock)'

    // INSERT über Admin‑Client (umgeht RLS)
    const { error: insertError } = await supabaseAdmin
      .from('prompts')
      .insert({ user_id: userId, prompt, response: text })

    if (insertError) {
      console.error('Insert‑Error:', insertError)
      throw insertError
    }

    return res.status(200).json({ response: text })
  } catch (err) {
    console.error('🚨 API-Error:', err)
    return res.status(500).json({ error: err.message || 'Server-Fehler' })
  }
}
