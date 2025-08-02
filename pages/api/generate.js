// pages/api/generate.js

import { supabaseAdmin } from '../../lib/supabaseAdmin' // muss deine Service-Role Instanz sein
// Optional: wenn du später echte OpenAI-Aufrufe machst, importiere dort das SDK
// import OpenAI from 'openai'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' })
  }

  const { prompt, userId } = req.body
  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Fehlender prompt oder userId' })
  }

  try {
    // Hier würdest du normalerweise OpenAI aufrufen. Für Mock / Test:
    const text = `Dies ist eine Testantwort zu: "${prompt}"`

    // 1. Prompt speichern
    const { error: insertError } = await supabaseAdmin
      .from('prompts')
      .insert({
        user_id: userId,
        prompt,
        response: text,
      })

    if (insertError) {
      console.error('Prompt insert error:', insertError)
      throw insertError
    }

    // 2. prompts_used in profiles inkrementieren (atomic read+update)
    // Lade aktuelles Profil
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('prompts_used')
      .eq('user_id', userId)
      .single()

    if (profileErr) {
      console.error('Profil laden fehlgeschlagen:', profileErr)
      // Nicht fatal, aber melden
    } else {
      const newUsed = (profile.prompts_used || 0) + 1
      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ prompts_used: newUsed, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (updateErr) {
        console.error('Failed to increment prompts_used:', updateErr)
      }
    }

    // 3. Antwort zurückgeben
    return res.status(200).json({ response: text })
  } catch (err) {
    console.error('🚨 API-Error:', err)
    return res.status(500).json({ error: err.message || 'Server-Fehler' })
  }
}
