import { findApp } from '@/lib/blob'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ViewPage({ params }: Props) {
  const { slug } = await params
  const html = await findApp(slug)

  if (!html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">✈️</div>
          <h1 className="text-xl font-bold text-gray-700 mb-2">App not found</h1>
          <p className="text-gray-400 text-sm mb-6">
            This link may have expired or never existed.
          </p>
          <a
            href="/"
            className="inline-block rounded-xl bg-purple-600 px-6 py-2.5 text-sm
              font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            Build your own →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Badge bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-xs">
        <span className="text-gray-300">✈️ Built with Jetpackers Vibe Lab</span>
        <a
          href="/"
          className="text-purple-400 hover:text-purple-300 font-medium"
        >
          Build yours →
        </a>
      </div>

      {/* Full-screen iframe */}
      <iframe
        title="Published app"
        srcDoc={html}
        sandbox="allow-scripts allow-forms"
        className="flex-1 border-none w-full"
      />
    </div>
  )
}
