// pages/dashboard.js

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { PromptList } from '../components/PromptList'
import { useProfile } from '../hooks/useProfile'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const { profile, setProfile, loading: loadingProfile, error: profileError } =
    useProfile()
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState(null)
  const [saving, setSaving] = useState(false)

  // Magic-Link Token aus Hash extrahieren und Session setzen
  useEffect(() => {
    const initSessionFromUrl = async () => {
      if (typeof window === 'undefined') return
      if (window.location.hash.includes('access_token')) {
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        })
        if (error) {
          console.error('Fehler beim Verarbeiten des Magic Link:', error)
        } else {
          // Hash entfernen, damit URL sauber aussieht
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
    }
    initSessionFromUrl()
  }, [])

  // Nutzer & Profil laden
  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setUser({ id: session.user.id, email: session.user.email })
      if (profile) {
        setNameInput(profile.full_name || '')
      }
    })()
  }, [router, profile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const saveName = async () => {
    if (!nameInput) return
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: nameInput }),
    })
    const json = await res.json()
    if (json.profile) {
      setProfile(json.profile)
      setEditingName(false)
    } else {
      console.error('Fehler beim Speichern des Namens', json)
    }
  }

  const submitPrompt = async (e) => {
    e.preventDefault()
    if (!prompt || !user) return
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
    } catch (err) {
      console.error('Prompt senden fehlgeschlagen', err)
    } finally {
      setSaving(false)
    }
  }

  if (!user)
    return <p className="p-4 text-center">Lade Benutzer-Session... Bitte kurz warten.</p>

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Kopfzeile / Profil */}
      <div className="flex justify-between items-center mb-6">
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
              >
                Speichern
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

      {/* Prompt-Formular */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Neuen Prompt eingeben</h2>
        <form onSubmit={submitPrompt} className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Schreibe deinen Prompt hier..."
            className="w-full border rounded p-2"
            rows={3}
            required
          />
          <button
            type="submit"
            disabled={saving}
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
