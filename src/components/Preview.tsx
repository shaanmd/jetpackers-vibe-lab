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
        className="w-full h-full flex flex-col gap-4 p-8 bg-white"
      >
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-1/2" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse w-full mt-2" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-2/5" />
        <p className="text-sm text-gray-400 text-center mt-6 animate-pulse">
          ✨ Building your app…
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
