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
  const versionCount = Math.floor(history.length / 2)

  return (
    <div className="flex h-full">
      {/* ── Dark left sidebar ── */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-gradient-to-b from-violet-950 via-purple-900 to-indigo-900">

        {/* Logo */}
        <div className="px-6 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl">✈️</span>
            <span className="font-bold text-white text-lg tracking-tight">
              Jetpackers Vibe Lab
            </span>
          </div>
          <p className="text-white/40 text-xs pl-9">Describe it. Build it. Share it.</p>
        </div>

        {/* Prompt area */}
        <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              {isFirstBuild ? '✨ What do you want to build?' : '🔄 What should we change?'}
            </p>
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
              className="w-full rounded-xl bg-white/10 border border-white/20 py-2.5
                text-sm font-semibold text-white hover:bg-white/20 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? '⏳ Publishing…' : '🔗 Publish & Share'}
            </button>
          )}
        </div>

        {/* Footer */}
        {versionCount > 0 && (
          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-xs text-white/30 text-center">
              {versionCount} version{versionCount !== 1 ? 's' : ''} built
            </p>
          </div>
        )}
      </div>

      {/* ── Right preview area ── */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {/* Browser chrome bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-gray-100 rounded-md px-3 py-1 text-xs text-gray-400 text-center max-w-xs mx-auto">
            {hasApp ? 'preview' : 'waiting for your prompt…'}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden">
          <Preview html={html} isLoading={isBuilding} />
        </div>
      </div>

      <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} />
    </div>
  )
}
