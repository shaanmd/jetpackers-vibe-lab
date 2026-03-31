'use client'

import { useState } from 'react'

interface ShareModalProps {
  url: string | null
  onClose: () => void
}

export function ShareModal({ url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!url) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(url!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Gradient header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl mb-1">🎉</div>
              <h2 className="text-xl font-bold">Your app is live!</h2>
              <p className="text-white/70 text-sm mt-0.5">Share it with anyone — no sign-up needed.</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-white/60 hover:text-white text-2xl leading-none mt-1"
            >
              ×
            </button>
          </div>
        </div>

        {/* Link + actions */}
        <div className="p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your link</p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
            <span className="text-sm text-gray-600 flex-1 truncate">{url}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              aria-label="Copy"
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold
                text-white hover:bg-violet-700 transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy link'}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl border-2 border-violet-200 py-2.5 text-sm
                font-semibold text-violet-600 hover:bg-violet-50 transition-colors text-center"
            >
              Open →
            </a>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            ✈️ Built with Jetpackers Vibe Lab
          </p>
        </div>
      </div>
    </div>
  )
}
