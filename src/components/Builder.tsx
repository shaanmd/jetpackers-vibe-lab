'use client'

import { useState } from 'react'
import { PromptInput } from './PromptInput'
import { Preview } from './Preview'
import { ShareModal } from './ShareModal'
import type { Attachment, Message } from '@/types'

interface PublishedApp {
  url: string
  slug: string
  label: string
}

export function Builder() {
  const [html, setHtml] = useState('')
  const [history, setHistory] = useState<Message[]>([])
  const [isBuilding, setIsBuilding] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [publishedApps, setPublishedApps] = useState<PublishedApp[]>([])
  const [totalBuilds, setTotalBuilds] = useState(0)
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'build' | 'history'>('build')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  async function handleBuild(prompt: string, attachment?: Attachment) {
    setIsBuilding(true)

    try {
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history, attachment }),
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
      setTotalBuilds(n => n + 1)
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: prompt },
        { role: 'assistant', content: accumulated },
      ])
      setPromptHistory((prev) => [...prev, prompt])
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

      // Add to My Apps list with a short label
      const appNumber = publishedApps.length + 1
      setPublishedApps(prev => [
        { url: data.url, slug: data.slug, label: `App ${appNumber}` },
        ...prev,
      ])
    } catch (err) {
      console.error('Publish error:', err)
    } finally {
      setIsPublishing(false)
    }
  }

  function handleCopy(prompt: string, index: number) {
    navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
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
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo.png" alt="Jetpackers" className="w-9 h-9 object-contain" />
            <span className="font-bold text-white text-lg tracking-tight">
              Jetpackers Vibe Lab
            </span>
          </div>
          <p className="text-white/40 text-xs pl-12">Describe it. Build it. Share it.</p>
        </div>

        {/* ── Tab bar ── */}
        <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
          <div className="flex gap-1 bg-black/20 rounded-lg p-1">
            {(['build', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                  activeTab === tab
                    ? 'bg-white/15 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab === 'build' ? '🔨 Build' : '📜 History'}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt area */}
        {activeTab === 'build' && (
          <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto min-h-0">
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

            {/* My Apps */}
            {publishedApps.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  📱 My Apps
                </p>
                <div className="flex flex-col gap-2">
                  {publishedApps.map((app) => (
                    <a
                      key={app.slug}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl bg-white/10
                        border border-white/20 px-3 py-2 text-sm text-white/80
                        hover:bg-white/20 hover:text-white transition-colors group"
                    >
                      <span>🚀 {app.label}</span>
                      <span className="text-white/40 group-hover:text-white/70 text-xs">Open →</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto min-h-0">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              📜 Prompt History
            </p>
            {promptHistory.length === 0 ? (
              <p className="text-white/30 text-sm text-center mt-8">
                Your prompts will appear here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...promptHistory].reverse().map((prompt, i) => {
                  const originalIndex = promptHistory.length - 1 - i
                  return (
                    <li
                      key={originalIndex}
                      className="flex items-start gap-2 bg-white/8 rounded-xl px-3 py-2.5"
                    >
                      <p
                        className="flex-1 text-sm text-white/70 line-clamp-2 min-w-0"
                        title={prompt}
                      >
                        {prompt}
                      </p>
                      <button
                        onClick={() => handleCopy(prompt, originalIndex)}
                        aria-label={
                          copiedIndex === originalIndex ? 'Copied' : 'Copy prompt'
                        }
                        className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors mt-0.5 text-base leading-none"
                      >
                        {copiedIndex === originalIndex ? '✓' : '📋'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Footer stats */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-white/30">
            {totalBuilds} build{totalBuilds !== 1 ? 's' : ''} this session
          </p>
          {versionCount > 0 && (
            <p className="text-xs text-white/30">
              v{versionCount} current
            </p>
          )}
        </div>
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
