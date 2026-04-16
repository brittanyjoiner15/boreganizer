'use client'

import { useState, useTransition } from 'react'
import { disconnectIntegration, updateEventType } from '@/app/actions/integrations'

interface Props {
  provider: 'trello' | 'google_calendar'
  eventType?: 'all_day' | 'timed'
}

export default function IntegrationActions({ provider, eventType }: Props) {
  const [currentEventType, setCurrentEventType] = useState<'all_day' | 'timed'>(eventType ?? 'timed')
  const [isPending, startTransition] = useTransition()

  function handleEventTypeChange(type: 'all_day' | 'timed') {
    setCurrentEventType(type)
    startTransition(async () => {
      await updateEventType(type)
    })
  }

  return (
    <div className="space-y-3">
      {provider === 'google_calendar' && (
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-1">Event type</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleEventTypeChange('timed')}
              disabled={isPending}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                currentEventType === 'timed'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              Timed (12pm)
            </button>
            <button
              onClick={() => handleEventTypeChange('all_day')}
              disabled={isPending}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                currentEventType === 'all_day'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              All day
            </button>
          </div>
        </div>
      )}

      <form action={disconnectIntegration}>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-red-200 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors"
        >
          Disconnect
        </button>
      </form>
    </div>
  )
}
