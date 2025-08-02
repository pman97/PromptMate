// pages/login.js

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    console.log('Magic Link redirect to:', `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`)

    const { error } = await supabase.auth.signInWithOtp(
      { email },
      { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` }
    )

    if (error) {
      setMessage(`Fehler: ${error.message}`)
    } else {
      setMessage('Magic Link gesendet – prüfe deinen Posteingang!')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Login mit Magic Link</h1>
      <form onSubmit={handleLogin} className="space-y-4 w-full max-w-sm">
        <input
          className="w-full p-2 border rounded"
          type="email"
          placeholder="Deine E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Link senden
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  )
}
