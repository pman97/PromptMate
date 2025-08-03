// pages/api/generate.js

import { createClient } from '@supabase/supabase-js'
import { Configuration, OpenAIApi } from 'openai'
import { supabase, supabaseAdmin } from '../../lib/supabase'


// Supabase normaler Client (für Session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Admin-Client für writes (umgeht RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// OpenAI-Client (nur, wenn du API nutzt)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

async function getUserIdFromRequest(req) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session && session.user) {
    return session.user.id
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (token) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)
    if (!error && user) return user.id
  }

  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' })
  }

  const { prompt, userId } = req.body
  const resolvedUserId = userId || (await getUserIdFromRequest(req))
  if (!prompt || !resolvedUserId) {
    return res.status(400).json({ error: 'Fehlender prompt oder userId' })
  }

  try {
    // 1. Profil prüfen (Limit)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('prompt_limit, prompts_used')
      .eq('user_id', resolvedUserId)
      .maybeSingle()
    if (profileErr) throw profileErr
    if (!profile) {
      // Falls noch kein Profil existiert, anlegen
      await supabaseAdmin.from('profiles').upsert(
        { user_id: resolvedUserId },
        { onConflict: 'user_id' }
      )
    }

    // Neu laden
    const { data: freshProfile } = await supabaseAdmin
      .from('profiles')
      .select('prompt_limit, prompts_used')
      .eq('user_id', resolvedUserId)
      .maybeSingle()

    if (freshProfile.prompts_used >= freshProfile.prompt_limit) {
      return res
        .status(400)
        .json({ error: 'Limit erreicht', response: null, limitReached: true })
    }

    // 2. GPT-4 oder Mock (hier Mock, ersetze wenn du willst)
    let text = 'Dies ist eine Testantwort (Mock)'
    // Wenn du echten OpenAI-Aufruf willst, z.B.:
    /*
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    })
    text = completion.data.choices[0].message.content
    */

    // 3. Prompt + Antwort speichern
    const { error: insertErr } = await supabaseAdmin.from('prompts').insert({
      user_id: resolvedUserId,
      prompt,
      response: text,
    })
    if (insertErr) throw insertErr

    // 4. prompts_used atomar erhöhen
    const { error: incErr } = await supabaseAdmin.rpc('increment_prompts_used', {
      p_user_id: resolvedUserId,
    })
    if (incErr) {
      // Fallback: einfach updaten (race condition möglich, aber okay)
      await supabaseAdmin
        .from('profiles')
        .update({
          prompts_used: freshProfile.prompts_used + 1,
        })
        .eq('user_id', resolvedUserId)
    }

    return res.status(200).json({ response: text })
  } catch (err) {
    console.error('🚨 API-Error:', err)
    return res
      .status(500)
      .json({ error: err.message || 'Server-Fehler', response: null })
  }
}
