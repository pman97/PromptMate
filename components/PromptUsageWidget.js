// components/PromptUsageWidget.js

import { useState, useEffect } from 'react'

export function PromptUsageWidget({ profile, refreshProfile }) {
  const [localProfile, setLocalProfile] = useState(profile)
  const [loading, setLoading] = useState(false)
  const limit = localProfile?.prompt_limit ?? 0
  const used = localProfile?.prompts_used ?? 0
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

  // Sync wenn sich parent profile ändert
  useEffect(() => {
    setLocalProfile(profile)
  }, [profile])

  const handleRefresh = async () => {
    if (typeof refreshProfile === 'function') {
      setLoading(true)
      await refreshProfile()
      setLoading(false)
    } else {
      setLoading(true)
      try {
        const res = await fetch('/api/profile')
        const json = await res.json()
        if (json.profile) setLocalProfile(json.profile)
      } catch (e) {
        console.error('Profil-Refresh fehlgeschlagen', e)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="border rounded p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-sm font-medium">Prompt-Nutzung</p>
          <p className="text-xs text-gray-600">
            {used} von {limit} verwendet
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="text-xs underline"
        >
          {loading ? 'Lädt…' : 'Aktualisieren'}
        </button>
      </div>
      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
        <div
          style={{ width: `${percent}%` }}
          className={`h-2 rounded ${
            percent >= 100 ? 'bg-red-500' : 'bg-green-500'
          }`}
        />
      </div>
      <p className="mt-1 text-xs">
        {percent}% {percent >= 100 && '(Limit erreicht)'}
      </p>
    </div>
  )
}
