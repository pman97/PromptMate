// pages/dashboard.js

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { PromptList } from '../components/PromptList'
import { PromptUsageWidget } from '../components/PromptUsageWidget'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [profile, setProfile] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState(null)

  // 1. Session / Magic Link verarbeiten und User setzen
  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return

      if (window.location.hash.includes('access_token')) {
        const { error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        })
        if (error) {
          console.error('Magic link Verarbeiten Fehler:', error)
        } else {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      console.log('=== Supabase session on dashboard load ===', session, sessionError)

      if (!session || !session.user) {
        router.replace('/login')
        return
      }

      setUser({ id: session.user.id, email: session.user.email })
      setAccessToken(session.access_token)
    }

    init()
  }, [router])

  // 2. Profil laden sobald accessToken verfügbar ist
  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) return
      setLoadingProfile(true)
      try {
        const res = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        const json = await res.json()
        if (json.profile) {
          setProfile(json.profile)
          setNameInput(json.profile.full_name || '')
        } else if (json.error) {
          setProfileError(json.error)
        }
      } catch (e) {
        setProfileError(e.message)
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [accessToken])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const refreshProfile = async () => {
    if (!accessToken) return
    setLoadingProfile(true)
    try {
      const res = await fetch('/api/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const json = await res.json()
      if (json.profile) {
        setProfile(json.profile)
      } else if (json.error) {
        setProfileError(json.error)
      }
    } catch (e) {
      setProfileError(e.message)
    } finally {
      setLoadingProfile(false)
    }
  }

  const saveName = async () => {
    if (!nameInput || !accessToken) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ full_name: nameInput }),
      })
      const json = await res.json()
      if (json.profile) {
        setProfile(json.profile)
        setNameInput(json.profile.full_name || '')
        setEditingName(false)
      } else {
        console.error('Fehler beim Speichern des Namens', json)
      }
    } catch (err) {
      console.error('SaveName failed', err)
    } finally {
      setSaving(false)
    }
  }

  const submitPrompt = async (e) => {
    e.preventDefault()
    if (!prompt || !user) return
    if (profile && profile.prompts_used >= profile.prompt_limit) return
    setSaving(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId: user.id }),
      })
      const data = await res.json()
      setResponse(data.response || 'Keine Antwort erhalten')
      setPrompt('')
      await refreshProfile()
    } catch (err) {
      console.error('Prompt senden fehlgeschlagen', err)
    } finally {
      setSaving(false)
    }
  }

  if (!user)
    return <p className="p-4 text-center">Lade Benutzer-Session... Bitte kurz warten.</p>

  const limitReached = profile && profile.prompts_used >= profile.prompt_limit

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header / Profil */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">
            Hallo, {profile?.full_name || user.email}
          </h1>
          {!loadingProfile && (
            <p className="text-sm text-gray-500">
              Verwendet: {profile?.prompts_used ?? 0} / {profile?.prompt_limit}
            </p>
          )}
          {loadingProfile && <p className="text-sm text-gray-400">Lade Profil…</p>}
          {profileError && (
            <p className="text-sm text-red-500">Fehler: {profileError}</p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {editingName ? (
            <>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="border p-1 rounded"
                placeholder="Name"
              />
              <button
                onClick={saveName}
                className="px-3 py-1 bg-green-600 text-white rounded"
                disabled={saving}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                onClick={() => {
                  setEditingName(false)
                  setNameInput(profile?.full_name || '')
                }}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Abbrechen
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm underline"
            >
              {profile?.full_name ? 'Name bearbeiten' : 'Namen setzen'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Usage Widget */}
      <PromptUsageWidget profile={profile} refreshProfile={refreshProfile} />

      {/* Prompt-Formular */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Neuen Prompt eingeben</h2>
        {limitReached && (
          <p className="text-red-600 mb-2">
            Du hast dein Limit erreicht. Du kannst keine weiteren Prompts senden.
          </p>
        )}
        <form onSubmit={submitPrompt} className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Schreibe deinen Prompt hier..."
            className="w-full border rounded p-2"
            rows={3}
            required
            disabled={limitReached || saving}
          />
          <button
            type="submit"
            disabled={saving || limitReached}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {saving ? 'Sende...' : 'Prompt abschicken'}
          </button>
        </form>
        {response && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-medium">Antwort:</p>
            <pre className="whitespace-pre-wrap">{response}</pre>
          </div>
        )}
      </div>

      {/* Gespeicherte Prompts */}
      <PromptList />
    </div>
  )
}
