'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveTrelloToken } from '@/app/actions/integrations'

export default function TrelloCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.slice(1) // strip leading #
    const token = new URLSearchParams(hash).get('token')

    if (!token) {
      router.replace('/integrations?error=trello_denied')
      return
    }

    saveTrelloToken(token).then((result) => {
      if (result?.error) {
        router.replace('/integrations?error=trello_failed')
      } else {
        router.replace('/integrations?setup=trello')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <p className="text-stone-400 text-sm">Connecting to Trello...</p>
    </div>
  )
}
