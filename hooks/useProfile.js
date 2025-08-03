// hooks/useProfile.js

import { useState, useEffect } from 'react'

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
  }, [])

  return { profile, setProfile, loading, error, refresh: loadProfile }
}
