// components/LimitUpgradeModal.js

import { useState } from 'react'

export function LimitUpgradeModal({ open, onClose, onUpgrade }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-2">Limit erreicht</h2>
        <p className="mb-4">
          Du hast deine Prompt-Nutzung (Limit) erreicht. Möchtest du mehr
          freischalten?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Upgrade
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded"
          >
            Später
          </button>
        </div>
      </div>
    </div>
  )
}
