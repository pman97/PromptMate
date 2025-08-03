// hooks/useProfile.js

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile')
      const json = await res.json()
      if (json.profile) {
        setProfile(json.profile)
      } else if (json.error) {
        setError(json.error)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // optional: du könntest hier auch ein Interval setzen für Polling, aber
    // für jetzt reicht einmal beim Mount.
  }, [])

  return { profile, setProfile, loading, error, refresh: loadProfile }
}
