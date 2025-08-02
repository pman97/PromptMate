<<<<<<< HEAD
=======
// pages/login.js

>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
<<<<<<< HEAD
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setMessage('Fehler: ' + error.message)
    } else {
      setMessage('Bitte prüfe deine E-Mail für den Login-Link.')
=======

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Nutzt deine ENV‑Variable (ohne Slash am Ende), z. B.:
        // .env.local → NEXT_PUBLIC_SITE_URL=http://localhost:3000
        // Vercel Env → NEXT_PUBLIC_SITE_URL=https://deine-vercel-domain
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
      }
    })

    if (error) {
      setMessage(`Fehler: ${error.message}`)
    } else {
      setMessage('Magic Link gesendet – prüfe deinen Posteingang!')
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9
    }
  }

  return (
<<<<<<< HEAD
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
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Login-Link senden
        </button>
        {message && <p className="text-center mt-4 text-gray-700">{message}</p>}
      </form>
    </div>
  )
=======
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl mb-4">Login mit Magic Link</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Deine E‑Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
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
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9
}
