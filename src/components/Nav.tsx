'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 h-16">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            pathname === '/dashboard' ? 'text-violet-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-xs font-semibold">Home</span>
        </Link>

        <Link
          href="/tasks/new"
          className="flex flex-col items-center gap-0.5 px-3 py-1"
        >
          <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center shadow-lg -mt-5">
            <span className="text-white text-2xl font-bold leading-none">+</span>
          </div>
        </Link>

        <Link
          href="/household"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            pathname === '/household' ? 'text-violet-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <span className="text-xl">🏡</span>
          <span className="text-xs font-semibold">Household</span>
        </Link>

        <Link
          href="/settings"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            pathname.startsWith('/settings') || pathname === '/integrations' ? 'text-violet-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <span className="text-xl">⚙️</span>
          <span className="text-xs font-semibold">Settings</span>
        </Link>
      </div>
    </nav>
  )
}
