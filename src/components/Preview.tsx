'use client'

interface PreviewProps {
  html: string
  isLoading: boolean
}

export function Preview({ html, isLoading }: PreviewProps) {
  if (isLoading) {
    return (
      <div
        data-testid="preview-loading"
        className="w-full h-full flex flex-col gap-3 p-6 bg-gray-50"
      >
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="h-32 bg-gray-200 rounded animate-pulse w-full" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        <p className="text-sm text-gray-400 text-center mt-4">Building your app…</p>
      </div>
    )
  }

  if (!html) {
    return (
      <div
        data-testid="preview-empty"
        className="w-full h-full flex items-center justify-center bg-gray-50"
      >
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-3">✈️</div>
          <p className="text-sm">Your app will appear here</p>
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
