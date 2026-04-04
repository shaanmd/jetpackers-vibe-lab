'use client'

import { useRef, useState } from 'react'
import type { Attachment, ImageMimeType } from '@/types'

interface PromptInputProps {
  onSubmit: (prompt: string, attachment?: Attachment) => void
  isDisabled: boolean
  label: string
  placeholder?: string
}

const ALLOWED_IMAGE_TYPES: ImageMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const IMAGE_MAX_BYTES = 5 * 1024 * 1024   // 5 MB
const CSV_MAX_BYTES = 500 * 1024           // 500 KB

function validateFile(file: File): string | null {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type as ImageMimeType)
  const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')

  if (!isImage && !isCsv) {
    return 'Only images (jpg, png, gif, webp) and CSV files are supported.'
  }
  if (isImage && file.size > IMAGE_MAX_BYTES) {
    return `${file.name} is too large. Images must be under 5MB.`
  }
  if (isCsv && file.size > CSV_MAX_BYTES) {
    return `${file.name} is too large. CSVs must be under 500KB.`
  }
  return null
}

export function PromptInput({
  onSubmit,
  isDisabled,
  label,
  placeholder = 'Describe your app…',
}: PromptInputProps) {
  const [value, setValue] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [attachError, setAttachError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input so the same file can be re-selected
    e.target.value = ''

    const error = validateFile(file)
    if (error) {
      setAttachError(error)
      setAttachment(null)
      return
    }

    setAttachError(null)
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type as ImageMimeType)
    const reader = new FileReader()

    if (isImage) {
      reader.onload = (evt) => {
        const base64 = evt.target!.result as string
        setAttachment({
          type: 'image',
          name: file.name,
          base64,
          mimeType: file.type as ImageMimeType,
        })
      }
      reader.readAsDataURL(file)
    } else {
      reader.onload = (evt) => {
        const text = evt.target!.result as string
        const rowCount = Math.max(0, text.split('\n').filter((l) => l.trim()).length - 1)
        setAttachment({
          type: 'csv',
          name: file.name,
          text,
          rowCount,
        })
      }
      reader.readAsText(file)
    }
  }

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    if (attachment) {
      onSubmit(trimmed, attachment)
    } else {
      onSubmit(trimmed)
    }
    setValue('')
    setAttachment(null)
    setAttachError(null)
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

      {/* Attach button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="text-xs text-white/50 hover:text-white/80 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Attach image or CSV"
        >
          📎 Attach image or CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Error message */}
      {attachError && (
        <p className="text-xs text-red-400">{attachError}</p>
      )}

      {/* File preview strip */}
      {attachment && (
        <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3 py-2">
          {attachment.type === 'image' ? (
            <img
              src={attachment.base64}
              alt={attachment.name}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
            />
          ) : (
            <span className="text-lg flex-shrink-0">📄</span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{attachment.name}</p>
            {attachment.type === 'csv' && (
              <p className="text-xs text-white/50">· {attachment.rowCount} rows</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-white/50 hover:text-white/80 text-sm flex-shrink-0"
            aria-label="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}

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
