// pages/dashboard.js
<<<<<<< HEAD

=======
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { PromptList } from '../components/PromptList'
<<<<<<< HEAD
import { useProfile } from '../hooks/useProfile'
=======
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
<<<<<<< HEAD
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const { profile, setProfile, loading: loadingProfile, error: profileError } = useProfile()

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
=======
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        setUser({ id: session.user.id, email: session.user.email })
      }
    })
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setResponse(null)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userId: user.id }),
    })
    const data = await res.json()
    setResponse(data.response || data.error)
    setLoading(false)
    setPrompt('')
  }
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

<<<<<<< HEAD
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
    }
  }

  if (!user) return <p className="p-4 text-center">Lade…</p>

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Kopfzeile */}
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

      {/* PromptList */}
=======
  if (!user) return <p className="p-4 text-center">Lade …</p>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hallo, {user.email}</h1>
        <button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded">
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full p-2 border rounded"
          rows={4}
          placeholder="Gib deinen Prompt hier ein..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? 'Wird generiert…' : 'Prompt an GPT-4 senden'}
        </button>
      </form>

      {response && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Antwort von GPT-4:</h2>
          <p>{response}</p>
        </div>
      )}

      <h2 className="mt-12 text-xl font-semibold">Deine gespeicherten Prompts</h2>
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9
      <PromptList />
    </div>
  )
}
