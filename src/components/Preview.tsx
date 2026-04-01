'use client'

import { useEffect, useState } from 'react'

interface PreviewProps {
  html: string
  isLoading: boolean
}

const BUILD_MESSAGES = [
  '✨ Conjuring your creation…',
  '🎨 Painting with pixels…',
  '⚡ Bending reality to your will…',
  '🚀 Teaching electrons to dance…',
  '🌟 Weaving digital sorcery…',
  '🛸 Summoning something spectacular…',
  '💫 Making the internet jealous…',
  '🎭 Crafting your masterpiece…',
  '🔮 Consulting the AI oracle…',
  '🦄 Sprinkling in the magic…',
]

export function Preview({ html, isLoading }: PreviewProps) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (!isLoading) return
    setMsgIndex(Math.floor(Math.random() * BUILD_MESSAGES.length))
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % BUILD_MESSAGES.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [isLoading])

  if (isLoading) {
    return (
      <div
        data-testid="preview-loading"
        className="w-full h-full flex flex-col items-center justify-center gap-6 bg-white p-8"
      >
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-1/2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse w-full mt-2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        </div>
        <p
          key={msgIndex}
          className="text-sm font-medium text-purple-500 animate-pulse transition-all duration-500"
        >
          {BUILD_MESSAGES[msgIndex]}
        </p>
      </div>
    )
  }

  if (!html) {
    return (
      <div
        data-testid="preview-empty"
        className="w-full h-full flex items-center justify-center bg-white"
      >
        <div className="text-center text-gray-300 max-w-xs px-6">
          <div className="text-6xl mb-4">✈️</div>
          <p className="text-base font-medium text-gray-400 mb-1">Your app will appear here</p>
          <p className="text-sm text-gray-300">
            Type a prompt on the left and hit <strong className="text-gray-400">Build it →</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      title="App preview"
      srcDoc={html}
      sandbox="allow-scripts allow-forms"
      className="w-full h-full border-none"
    />
  )
}
