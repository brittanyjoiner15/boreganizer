import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { connectTrello, connectGoogle } from '@/app/actions/integrations'
import type { UserIntegration } from '@/types'
import TrelloSetup from './TrelloSetup'
import IntegrationActions from './IntegrationActions'

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; connected?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: UserIntegration | null }

  const params = await searchParams
  const showTrelloSetup =
    params.setup === 'trello' &&
    integration?.provider === 'trello' &&
    !integration?.is_active

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Integrations</h1>
      <p className="text-stone-500 mb-8 text-sm">
        Connect Boreganizer to your other tools so tasks show up where you already work.
        You can connect one at a time.
      </p>

      {params.error === 'trello_denied' && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          Trello connection was cancelled.
        </div>
      )}
      {params.error === 'google_denied' && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          Google Calendar connection was cancelled.
        </div>
      )}
      {params.error === 'google_failed' && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          Something went wrong connecting to Google Calendar. Try again.
        </div>
      )}
      {params.connected === 'google' && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
          Google Calendar connected!
        </div>
      )}

      {showTrelloSetup && <TrelloSetup />}

      <div className="space-y-4">
        {/* Google Calendar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📅</span>
            <div className="flex-1">
              <h2 className="font-semibold text-stone-800">Google Calendar</h2>
              <p className="text-xs text-stone-400">Creates events for your tasks</p>
            </div>
            {integration?.provider === 'google_calendar' && integration.is_active && (
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Connected
              </span>
            )}
          </div>

          {integration?.provider === 'google_calendar' && integration.is_active ? (
            <div className="space-y-3">
              <IntegrationActions provider="google_calendar" eventType={integration.event_type} />
              {integration.last_sync_error && (
                <p className="text-xs text-red-400">Last sync error: {integration.last_sync_error}</p>
              )}
            </div>
          ) : (
            <div>
              <form action={connectGoogle}>
                <button
                  type="submit"
                  disabled={!!integration && integration.provider !== 'google_calendar'}
                  className="w-full py-2.5 px-4 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Connect Google Calendar
                </button>
              </form>
              {!!integration && integration.provider !== 'google_calendar' && (
                <p className="text-xs text-stone-400 mt-2 text-center">
                  Disconnect Trello first
                </p>
              )}
            </div>
          )}
        </div>

        {/* Trello */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <h2 className="font-semibold text-stone-800">Trello</h2>
              <p className="text-xs text-stone-400">Creates cards for your tasks</p>
            </div>
            {integration?.provider === 'trello' && integration.is_active && (
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Connected
              </span>
            )}
          </div>

          {integration?.provider === 'trello' && integration.is_active ? (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                Board: <span className="font-medium">{integration.trello_board_name}</span>
                {' / '}
                List: <span className="font-medium">{integration.trello_list_name}</span>
              </p>
              <IntegrationActions provider="trello" />
              {integration.last_sync_error && (
                <p className="text-xs text-red-400">Last sync error: {integration.last_sync_error}</p>
              )}
            </div>
          ) : (
            <div>
              <form action={connectTrello}>
                <button
                  type="submit"
                  disabled={!!integration && integration.provider !== 'trello'}
                  className="w-full py-2.5 px-4 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Connect Trello
                </button>
              </form>
              {!!integration && integration.provider !== 'trello' && (
                <p className="text-xs text-stone-400 mt-2 text-center">
                  Disconnect Google Calendar first
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
