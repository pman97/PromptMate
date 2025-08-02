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
          {loadingProfile && (
            <p className="text-sm text-gray-400">Lade Profil…</p>
          )}
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
      <PromptList />
    </div>
  )
}
