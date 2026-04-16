import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/integrations?error=trello_denied', request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Store token; is_active stays false until board/list are selected
  await supabase.from('user_integrations').upsert(
    {
      user_id: user.id,
      provider: 'trello',
      access_token: token,
      refresh_token: null,
      token_expires_at: null,
      trello_board_id: null,
      trello_board_name: null,
      trello_list_id: null,
      trello_list_name: null,
      is_active: false,
      last_sync_error: null,
    },
    { onConflict: 'user_id' }
  )

  return NextResponse.redirect(new URL('/integrations?setup=trello', request.url))
}
