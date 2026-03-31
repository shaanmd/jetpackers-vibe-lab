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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Your app is live! 🎉</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-3">Share this link with anyone:</p>

        <div className="flex gap-2 items-center bg-gray-50 rounded-xl p-3 mb-4">
          <span className="text-sm text-gray-700 flex-1 truncate">{url}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            aria-label="Copy"
            className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold
              text-white hover:bg-purple-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-purple-200 py-2.5 text-sm
              font-semibold text-purple-600 hover:bg-purple-50 transition-colors text-center"
          >
            Open →
          </a>
        </div>
      </div>
    </div>
  )
}
