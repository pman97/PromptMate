import { supabaseAdmin } from '../../lib/supabase'
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { prompt, userId } = req.body
  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Prompt und UserId erforderlich.' })
  }

  // Profil/Limit prüfen
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('prompt_limit, prompts_used')
    .eq('user_id', userId)
    .single()

  if (profileError) {
    return res.status(500).json({ error: 'Profil konnte nicht geladen werden.' })
  }
  if (profile && profile.prompts_used >= profile.prompt_limit) {
    return res.status(429).json({ error: 'Dein Prompt-Limit ist erreicht.' })
  }

  try {
    // Anfrage an OpenAI
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    })
    const responseText = completion.data.choices[0]?.message?.content || ''

    // Prompt und Antwort speichern
    const { error: dbError } = await supabaseAdmin
      .from('prompts')
      .insert([{ user_id: userId, prompt, response: responseText }])
    if (dbError) {
      console.error('Fehler beim Speichern:', dbError)
    }

    // Counter hochzählen
    await supabaseAdmin
      .from('profiles')
      .update({ prompts_used: profile.prompts_used + 1 })
      .eq('user_id', userId)

    res.status(200).json({ response: responseText })
  } catch (err) {
    console.error('Error in /api/generate:', err)
    res.status(500).json({ error: err.message || 'Fehler beim Generieren.' })
  }
}
