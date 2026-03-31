'use client'

import { useState } from 'react'
import { PromptInput } from './PromptInput'
import { Preview } from './Preview'
import { ShareModal } from './ShareModal'
import type { Message } from '@/types'

export function Builder() {
  const [html, setHtml] = useState('')
  const [history, setHistory] = useState<Message[]>([])
  const [isBuilding, setIsBuilding] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  async function handleBuild(prompt: string) {
    setIsBuilding(true)

    try {
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history }),
      })

      if (!response.ok) throw new Error('Build failed')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
      }

      setHtml(accumulated)
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: prompt },
        { role: 'assistant', content: accumulated },
      ])
    } catch (err) {
      console.error('Build error:', err)
    } finally {
      setIsBuilding(false)
    }
  }

  async function handlePublish() {
    if (!html) return
    setIsPublishing(true)

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, title: 'my app' }),
      })

      const data = await response.json()
      setShareUrl(data.url)
    } catch (err) {
      console.error('Publish error:', err)
    } finally {
      setIsPublishing(false)
    }
  }

  const hasApp = !!html && !isBuilding
  const isFirstBuild = history.length === 0

  return (
    <div className="flex h-full gap-4">
      {/* Left panel */}
      <div className="w-96 flex-shrink-0 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {isFirstBuild ? 'Describe your app' : 'Refine it'}
          </h2>
          <PromptInput
            onSubmit={handleBuild}
            isDisabled={isBuilding || isPublishing}
            label={isBuilding ? 'Building…' : isFirstBuild ? 'Build it →' : 'Update →'}
          />
        </div>

        {hasApp && (
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full rounded-xl border-2 border-purple-200 py-2.5 text-sm
              font-semibold text-purple-600 hover:bg-purple-50 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? 'Publishing…' : '🔗 Publish & Share'}
          </button>
        )}

        {history.length > 0 && (
          <div className="text-xs text-gray-400 text-center">
            {Math.floor(history.length / 2)} version{history.length > 2 ? 's' : ''} built
          </div>
        )}
      </div>

      {/* Right panel — preview */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <Preview html={html} isLoading={isBuilding} />
      </div>

      <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} />
    </div>
  )
}
