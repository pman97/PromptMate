// lib/profile.js
import { supabase } from './supabase'

export async function getOrCreateProfile(userId) {
  // Versuch zu laden
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, prompt_limit, prompts_used')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // kein Profil vorhanden -> anlegen
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert({ user_id: userId })
      .select()
      .single()
    if (insertErr) throw insertErr
    profile = inserted
  } else if (error) {
    throw error
  }

  return profile
}
