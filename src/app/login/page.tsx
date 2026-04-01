'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError('Wrong code — try again ✈️')
        setCode('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900">
      <div className="w-full max-w-sm mx-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Jetpackers" className="w-20 h-20 object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Jetpackers Vibe Lab</h1>
          <p className="text-white/50 text-sm mt-1">Enter your access code to continue</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              autoFocus
              autoComplete="off"
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3
                text-white placeholder-white/30 text-center text-lg tracking-widest
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />

            {error && (
              <p className="text-red-300 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full rounded-xl bg-purple-500 py-3 text-sm font-semibold
                text-white hover:bg-purple-400 transition-all active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '✨ Checking…' : 'Let\'s vibe →'}
            </button>
          </form>
        </div>

        <p className="text-white/25 text-xs text-center mt-6">
          Jetpackers AI · Workshop participants only
        </p>
      </div>
    </div>
  )
}
