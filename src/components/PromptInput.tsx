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
        rows={4}
        className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none
          focus:outline-none focus:ring-2 focus:ring-purple-400
          disabled:bg-gray-50 disabled:text-gray-400"
      />
      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold
          text-white hover:bg-purple-700 active:scale-95 transition-all
          disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      <p className="text-xs text-gray-400 text-right">⌘ + Enter to submit</p>
    </div>
  )
}
