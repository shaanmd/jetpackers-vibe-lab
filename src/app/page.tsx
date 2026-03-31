import { Builder } from '@/components/Builder'

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">✈️</span>
          <span className="font-bold text-gray-900">Jetpackers Vibe Lab</span>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">
          Describe it. Build it. Share it.
        </span>
      </header>

      {/* Main builder */}
      <main className="flex-1 p-6 overflow-hidden">
        <Builder />
      </main>
    </div>
  )
}
