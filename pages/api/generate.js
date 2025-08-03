// pages/api/generate.js

import { supabaseAdmin } from '../../lib/supabase'
import { Configuration, OpenAIApi } from 'openai'

// Initialisiere OpenAI SDK
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

  try {
    // Anfrage an OpenAI API
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = completion.data.choices[0]?.message?.content || ''

    // Antwort + Prompt in die Datenbank speichern (optional)
    const { error: dbError } = await supabaseAdmin
      .from('prompts')
      .insert([{ user_id: userId, prompt, response: responseText }])

    if (dbError) {
      console.error('Fehler beim DB-Speichern:', dbError)
    }

    res.status(200).json({ response: responseText })
  } catch (err) {
    console.error('Error in /api/generate:', err)
    res.status(500).json({ error: err.message || 'Fehler beim Generieren.' })
  }
}
