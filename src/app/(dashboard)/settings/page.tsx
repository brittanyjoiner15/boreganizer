import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default function SettingsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold text-stone-800 mb-8">Settings</h1>

      <div className="space-y-3">
        <Link
          href="/integrations"
          className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 p-5 hover:border-stone-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔌</span>
            <div>
              <p className="font-semibold text-stone-800">Integrations</p>
              <p className="text-xs text-stone-400">Connect Trello or Google Calendar</p>
            </div>
          </div>
          <span className="text-stone-300 text-lg">›</span>
        </Link>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 bg-white rounded-2xl border border-stone-200 p-5 hover:border-stone-300 transition-colors text-left"
          >
            <span className="text-2xl">👋</span>
            <p className="font-semibold text-stone-800">Sign out</p>
          </button>
        </form>
      </div>
    </div>
  )
}
