'use client'

import { useState } from 'react'
import { acceptInvite } from '@/app/actions/teams'

export default function AcceptInviteButton({ token }: { token: string }) {
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    setError(undefined)
    const result = await acceptInvite(token)
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Joining...' : 'Join household'}
      </button>
    </div>
  )
}
