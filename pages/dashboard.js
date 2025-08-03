import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { PromptList } from '../components/PromptList'

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
  const [showLimit, setShowLimit] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return

      if (window.location.hash.includes('access_token')) {
        const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
        if (error) {
          console.error('Fehler bei Magic Link:', error)
        } else {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !session.user) {
        router.replace('/login')
        return
      }
      setUser({ id: session.user.id, email: session.user.email })
      setAccessToken(session.access_token)
    }
    init()
  }, [router])

  // Profil laden
  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) return
      setLoadingProfile(true)
      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${accessToken}` },
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
        setProfileError(json.error || 'Unbekannter Fehler beim Speichern.')
      }
    } finally {
      setSaving(false)
    }
  }

  const submitPrompt = async (e) => {
    e.preventDefault()
    if (!prompt || !user) return
    if (profile && profile.prompts_used >= profile.prompt_limit) {
      setShowLimit(true)
      return
    }
    setSaving(true)
    setResponse(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId: user.id }),
      })
      const data = await res.json()
      setResponse(data.response || 'Keine Antwort erhalten')
      setPrompt('')
      // Profile reloaden (für Counter)
      const ref = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const refJson = await ref.json()
      if (refJson.profile) setProfile(refJson.profile)
    } catch (err) {
      setResponse('Fehler beim Senden des Prompts.')
    } finally {
      setSaving(false)
    }
  }

  if (!user)
    return <p className="p-4 text-center">Lade Benutzer-Session... Bitte kurz warten.</p>

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Profil */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Hallo, {profile?.full_name || user.email}
          </h1>
          {!loadingProfile && (
            <span className="text-xs text-gray-500">
              Benutzte Prompts: <b>{profile?.prompts_used ?? 0}</b> / {profile?.prompt_limit}
            </span>
          )}
          {loadingProfile && <span className="text-xs text-gray-400">Lade Profil…</span>}
          {profileError && (
            <div className="text-xs text-red-600">{profileError}</div>
          )}
        </div>
        <div className="flex gap-2">
          {editingName ? (
            <>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="border p-1 rounded text-sm"
                placeholder="Dein Name"
              />
              <button
                onClick={saveName}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                disabled={saving}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                onClick={() => {
                  setEditingName(false)
                  setNameInput(profile?.full_name || '')
                }}
                className="px-3 py-1 bg-gray-300 rounded text-xs"
              >
                Abbrechen
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="underline text-xs"
            >
              {profile?.full_name ? 'Name bearbeiten' : 'Namen setzen'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded text-xs"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Prompt */}
      <form onSubmit={submitPrompt} className="space-y-3 mb-10">
        <label className="font-semibold block">Prompt eingeben:</label>
        {profile && profile.prompts_used >= profile.prompt_limit && (
          <div className="text-red-600 mb-2 text-sm">
            <b>Du hast dein Prompt-Limit erreicht.</b> Upgrade demnächst möglich!
          </div>
        )}
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Schreibe deinen Prompt hier..."
          className="w-full border rounded p-2"
          rows={3}
          required
          disabled={profile && profile.prompts_used >= profile.prompt_limit}
        />
        <button
          type="submit"
          disabled={saving || (profile && profile.prompts_used >= profile.prompt_limit)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {saving ? 'Sende...' : 'Prompt abschicken'}
        </button>
        {response && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <div className="font-medium mb-1">Antwort:</div>
            <pre className="whitespace-pre-wrap text-sm">{response}</pre>
          </div>
        )}
      </form>

      {/* Prompt-Liste */}
      <PromptList />

      {/* Limit Modal */}
      {showLimit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-sm mx-auto">
            <h2 className="text-xl font-bold mb-2">Prompt-Limit erreicht</h2>
            <p className="mb-4">Du hast dein Kontingent aufgebraucht.<br />Upgrade demnächst möglich!</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowLimit(false)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
