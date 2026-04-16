'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTrelloAuthUrl, getTrelloBoards, getTrelloLists, registerTrelloWebhook, deregisterTrelloWebhook } from '@/lib/trello'
import { getGoogleAuthUrl } from '@/lib/google-calendar'
import { syncBackfill } from '@/lib/sync'
import type { UserIntegration } from '@/types'

export async function connectTrello() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  redirect(getTrelloAuthUrl(`${appUrl}/trello/callback`))
}

export async function saveTrelloToken(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('user_integrations').upsert(
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
  if (error) return { error: error.message }
  return { success: true }
}

export async function connectGoogle() {
  redirect(getGoogleAuthUrl())
}

export async function fetchTrelloBoards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'trello')
    .single()

  if (!integration) return { error: 'No Trello connection found' }

  try {
    const boards = await getTrelloBoards(integration.access_token)
    return { boards }
  } catch {
    return { error: 'Failed to fetch boards from Trello' }
  }
}

export async function fetchTrelloLists(boardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'trello')
    .single()

  if (!integration) return { error: 'No Trello connection found' }

  try {
    const lists = await getTrelloLists(integration.access_token, boardId)
    return { lists }
  } catch {
    return { error: 'Failed to fetch lists from Trello' }
  }
}

export async function saveTrelloSetup(
  boardId: string,
  boardName: string,
  listId: string,
  listName: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Register webhook — non-fatal if it fails, reverse sync just won't work
  let webhookId: string | null = null
  try {
    const { data: tokenRow } = await supabase
      .from('user_integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    if (tokenRow) {
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/trello`
      webhookId = await registerTrelloWebhook(tokenRow.access_token, boardId, callbackUrl)
    }
  } catch {
    // Continue without webhook
  }

  const { error } = await supabase
    .from('user_integrations')
    .update({
      trello_board_id: boardId,
      trello_board_name: boardName,
      trello_list_id: listId,
      trello_list_name: listName,
      trello_webhook_id: webhookId,
      is_active: true,
    })
    .eq('user_id', user.id)
    .eq('provider', 'trello')

  if (error) return { error: error.message }

  // Backfill existing tasks now that the integration is active
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: UserIntegration | null }

  if (integration) {
    await syncBackfill(supabase, user.id, integration)
  }

  revalidatePath('/integrations')
  return { success: true }
}

export async function updateEventType(eventType: 'all_day' | 'timed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_integrations')
    .update({ event_type: eventType })
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')

  if (error) return { error: error.message }
  revalidatePath('/integrations')
  return { success: true }
}

export async function disconnectIntegration() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Clean up Trello webhook if one was registered
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('provider, access_token, trello_webhook_id')
    .eq('user_id', user.id)
    .single()

  if (integration?.provider === 'trello' && integration.trello_webhook_id) {
    await deregisterTrelloWebhook(integration.access_token, integration.trello_webhook_id)
  }

  await supabase.from('user_integrations').delete().eq('user_id', user.id)
  redirect('/integrations')
}
