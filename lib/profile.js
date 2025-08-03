// lib/profile.js

import { supabase } from './supabase'

/**
 * Holt das Profil des aktuell eingeloggten Users.
 * @returns {Promise<{ profile: any|null, error: any|null }>}
 */
export async function getProfile() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { profile: null, error: 'Nicht eingeloggt' }
    }

    const userId = session.user.id

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, prompt_limit, prompts_used, user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return { profile: null, error }
    }

    return { profile, error: null }
  } catch (err) {
    return { profile: null, error: err }
  }
}

/**
 * Updated das Profilfeld full_name (du kannst das erweitern).
 * @param {Object} updates - z.B. { full_name: "Neuer Name" }
 * @returns {Promise<{ profile: any|null, error: any|null }>}
 */
export async function updateProfile(updates = {}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { profile: null, error: 'Nicht eingeloggt' }
    }

    const userId = session.user.id

    const row = { user_id: userId, ...updates }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'user_id', returning: 'representation' })
      .select('full_name, prompt_limit, prompts_used, user_id')
      .maybeSingle()

    if (error) {
      return { profile: null, error }
    }

    return { profile, error: null }
  } catch (err) {
    return { profile: null, error: err }
  }
}
