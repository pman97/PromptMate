// pages/dashboard.js

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { PromptList } from '../components/PromptList'
import { PromptUsageWidget } from '../components/PromptUsageWidget'
import { LimitUpgradeModal } from '../components/LimitUpgradeModal'

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
  const [showUpgrade, setShowUpgrade] = useState(false)

  // 1. Session / Magic Link verarbeiten und User/Token setzen
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
        console.log('DEBUG: GET /api/profile response:', json)
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
      console.log('DEBUG: refreshProfile response:', json)
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
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ full_name: nameInput }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const json = await res.json()
      console.log('DEBUG: PATCH /api/profile response:', json)
      if (json.profile) {
        setProfile(json.profile)
        setNameInput(json.profile.full_name || '')
        setEditingName(false)
      } else {
        console.error('Fehler beim Speichern des Namens', json)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('SaveName request timed out')
      } else {
        console.error('SaveName failed', err)
      }
    } finally {
      setSaving(false)
    }
  }

  const submitPrompt = async (e) => {
    e.preventDefault()
    if (!prompt || !user) return

    if (profile && profile.prompts_used >= profile.prompt_limit) {
      setShowUpgrade(true)
      return
    }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-1">
            Hallo, <span className="text-indigo-600">{profile?.full_name || user.email}</span>
          </h1>
          {!loadingProfile && (
            <p className="text-sm text-gray-500">
              Verwendet: <span className="font-medium">{profile?.prompts_used ?? 0}</span> /{' '}
              <span className="font-medium">{profile?.prompt_limit}</span>
            </p>
          )}
          {loadingProfile && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <span className="text-sm text-gray-400">Lade Profil…</span>
            </div>
          )}
          {profileError && (
            <p className="text-sm text-red-500 mt-1">Fehler: {profileError}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {editingName ? (
            <>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Name"
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:brightness-105 transition"
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                onClick={() => {
                  setEditingName(false)
                  setNameInput(profile?.full_name || '')
                }}
                className="px-3 py-2 bg-gray-200 rounded-lg"
              >
                Abbrechen
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm underline text-indigo-600"
            >
              {profile?.full_name ? 'Name bearbeiten' : 'Namen setzen'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:brightness-105 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Usage Widget */}
      <PromptUsageWidget profile={profile} refreshProfile={refreshProfile} />

      {/* Prompt-Formular */}
      <div className="mb-10 bg-white rounded-2xl shadow-md p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Neuen Prompt eingeben</h2>
          {limitReached && (
            <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
              Limit erreicht
            </span>
          )}
        </div>
        <form onSubmit={submitPrompt} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Schreibe deinen Prompt hier..."
            className="w-full border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[120px]"
            rows={4}
            required
            disabled={limitReached || saving}
          />
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <button
              type="submit"
              disabled={saving || limitReached}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow hover:scale-105 transition"
            >
              {saving ? 'Sende...' : 'Prompt abschicken'}
            </button>
            {response && (
              <div className="mt-2 sm:mt-0 p-4 bg-gray-50 rounded-lg flex-1 border">
                <p className="font-medium mb-1">Antwort:</p>
                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Gespeicherte Prompts */}
      <PromptList />

      <LimitUpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={() => {
          alert('Upgrade-Flow: Hier würdest du z.B. auf Bezahlseite leiten.')
        }}
      />
    </div>
  )
}
