// hooks/useProfile.js
import { useEffect, useState } from 'react'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profile')
        const json = await res.json()
        if (json.profile) {
          setProfile(json.profile)
        } else {
          setError(json.error || 'Konnte Profil nicht laden')
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { profile, setProfile, loading, error }
}
