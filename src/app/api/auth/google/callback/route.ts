import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeGoogleCode } from '@/lib/google-calendar'
import { syncBackfill } from '@/lib/sync'
import type { UserIntegration } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/integrations?error=google_denied', request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const tokens = await exchangeGoogleCode(code)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const { data: integration } = await supabase.from('user_integrations').upsert(
      {
        user_id: user.id,
        provider: 'google_calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        trello_board_id: null,
        trello_board_name: null,
        trello_list_id: null,
        trello_list_name: null,
        event_type: 'timed',
        is_active: true,
        last_sync_error: null,
      },
      { onConflict: 'user_id' }
    ).select().single() as { data: UserIntegration | null }

    if (integration) {
      await syncBackfill(supabase, user.id, integration)
    }

    return NextResponse.redirect(new URL('/integrations?connected=google', request.url))
  } catch {
    return NextResponse.redirect(new URL('/integrations?error=google_failed', request.url))
  }
}
