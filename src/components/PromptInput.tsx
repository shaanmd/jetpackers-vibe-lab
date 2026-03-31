'use client'

import { useState } from 'react'

interface PromptInputProps {
  onSubmit: (prompt: string) => void
  isDisabled: boolean
  label: string
  placeholder?: string
}

export function PromptInput({
  onSubmit,
  isDisabled,
  label,
  placeholder = 'Describe your app…',
}: PromptInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={5}
        className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm
          text-white placeholder-white/30 resize-none
          focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        className="w-full rounded-xl bg-purple-500 py-2.5 text-sm font-semibold
          text-white hover:bg-purple-400 active:scale-95 transition-all
          disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      <p className="text-xs text-white/25 text-right">⌘ + Enter to submit</p>
    </div>
  )
}
