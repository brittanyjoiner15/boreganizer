import type { SupabaseClient } from '@supabase/supabase-js'
import type { Task, UserIntegration, TaskSyncItem } from '@/types'
import { createTrelloCard, markTrelloCardComplete, updateTrelloCardDue } from './trello'
import { createGCalEvent, updateGCalEvent, refreshGoogleToken } from './google-calendar'

async function getValidGoogleToken(
  integration: UserIntegration,
  supabase: SupabaseClient
): Promise<string> {
  // Refresh if expired or expiring within 60s
  if (
    integration.refresh_token &&
    integration.token_expires_at &&
    new Date(integration.token_expires_at) <= new Date(Date.now() + 60_000)
  ) {
    const { access_token, expires_in } = await refreshGoogleToken(integration.refresh_token)
    await supabase
      .from('user_integrations')
      .update({
        access_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      })
      .eq('id', integration.id)
    return access_token
  }
  return integration.access_token
}

async function getUsersToSync(
  task: Task,
  actingUserId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  if (task.assigned_to) return [task.assigned_to]
  if (task.team_id) {
    // Unassigned team task: sync for all team members
    const { data } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', task.team_id)
    return (data ?? []).map((m: { user_id: string }) => m.user_id)
  }
  return [actingUserId]
}

async function getActiveIntegration(
  userId: string,
  supabase: SupabaseClient
): Promise<UserIntegration | null> {
  const { data } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()
  return data
}

export async function syncBackfill(
  supabase: SupabaseClient,
  userId: string,
  integration: UserIntegration
): Promise<void> {
  // Fetch all visible, active, time-based tasks with a due date (RLS scopes this to the user)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_archived', false)
    .eq('recurrence_type', 'time')
    .not('next_due_date', 'is', null)

  if (!tasks || tasks.length === 0) return

  for (const task of tasks) {
    try {
      // Skip if already has an active sync item for this user
      const { data: existing } = await supabase
        .from('task_sync_items')
        .select('id')
        .eq('task_id', task.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      if (existing) continue

      let externalId: string

      if (integration.provider === 'trello') {
        const card = await createTrelloCard(
          integration.access_token,
          integration.trello_list_id!,
          task.name,
          task.next_due_date
        )
        externalId = card.id
      } else {
        const token = await getValidGoogleToken(integration, supabase)
        const event = await createGCalEvent(token, task.name, task.next_due_date, integration.event_type)
        externalId = event.id
      }

      await supabase.from('task_sync_items').insert({
        task_id: task.id,
        user_id: userId,
        provider: integration.provider,
        external_id: externalId,
        status: 'active',
      })
    } catch (err) {
      await supabase
        .from('user_integrations')
        .update({ last_sync_error: String(err) })
        .eq('id', integration.id)
    }
  }
}

export async function syncOnCreate(
  supabase: SupabaseClient,
  task: Task,
  actingUserId: string
): Promise<void> {
  if (task.recurrence_type === 'mileage' || !task.next_due_date) return

  const userIds = await getUsersToSync(task, actingUserId, supabase)

  for (const userId of userIds) {
    try {
      const integration = await getActiveIntegration(userId, supabase)
      if (!integration) continue

      let externalId: string

      if (integration.provider === 'trello') {
        const card = await createTrelloCard(
          integration.access_token,
          integration.trello_list_id!,
          task.name,
          task.next_due_date
        )
        externalId = card.id
      } else {
        const token = await getValidGoogleToken(integration, supabase)
        const event = await createGCalEvent(token, task.name, task.next_due_date, integration.event_type)
        externalId = event.id
      }

      await supabase.from('task_sync_items').insert({
        task_id: task.id,
        user_id: userId,
        provider: integration.provider,
        external_id: externalId,
        status: 'active',
      })
    } catch (err) {
      await supabase
        .from('user_integrations')
        .update({ last_sync_error: String(err) })
        .eq('user_id', userId)
    }
  }
}

export async function syncUpdateDueDate(
  supabase: SupabaseClient,
  task: Task,
  actingUserId: string,
  newDueDate: string
): Promise<void> {
  const userIds = await getUsersToSync(task, actingUserId, supabase)

  for (const userId of userIds) {
    try {
      const integration = await getActiveIntegration(userId, supabase)
      if (!integration) continue

      const { data: syncItem } = await supabase
        .from('task_sync_items')
        .select('*')
        .eq('task_id', task.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single() as { data: TaskSyncItem | null }

      if (!syncItem) continue

      if (integration.provider === 'trello') {
        await updateTrelloCardDue(integration.access_token, syncItem.external_id, newDueDate)
      } else {
        const token = await getValidGoogleToken(integration, supabase)
        const updates =
          integration.event_type === 'all_day'
            ? { start: { date: newDueDate }, end: { date: newDueDate } }
            : {
                start: { dateTime: `${newDueDate}T12:00:00`, timeZone: 'UTC' },
                end: { dateTime: `${newDueDate}T12:30:00`, timeZone: 'UTC' },
              }
        await updateGCalEvent(token, syncItem.external_id, updates)
      }
    } catch (err) {
      await supabase
        .from('user_integrations')
        .update({ last_sync_error: String(err) })
        .eq('user_id', userId)
    }
  }
}

export async function syncOnComplete(
  supabase: SupabaseClient,
  task: Task,
  actingUserId: string,
  nextDueDate: string | null,
  completedAt: Date
): Promise<void> {
  if (task.recurrence_type === 'mileage') return

  const userIds = await getUsersToSync(task, actingUserId, supabase)

  for (const userId of userIds) {
    try {
      const integration = await getActiveIntegration(userId, supabase)
      if (!integration) continue

      const { data: syncItem } = await supabase
        .from('task_sync_items')
        .select('*')
        .eq('task_id', task.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single() as { data: TaskSyncItem | null }

      if (integration.provider === 'trello') {
        if (syncItem) {
          await markTrelloCardComplete(integration.access_token, syncItem.external_id)
          await supabase
            .from('task_sync_items')
            .update({ status: 'completed' })
            .eq('id', syncItem.id)
        }
        if (nextDueDate) {
          const card = await createTrelloCard(
            integration.access_token,
            integration.trello_list_id!,
            task.name,
            nextDueDate
          )
          await supabase.from('task_sync_items').insert({
            task_id: task.id,
            user_id: userId,
            provider: 'trello',
            external_id: card.id,
            status: 'active',
          })
        }
      } else {
        const token = await getValidGoogleToken(integration, supabase)

        if (syncItem) {
          const completionDateStr = completedAt.toISOString().split('T')[0]
          const updates =
            integration.event_type === 'all_day'
              ? {
                  summary: `✅ ${task.name}`,
                  start: { date: completionDateStr },
                  end: { date: completionDateStr },
                }
              : {
                  summary: `✅ ${task.name}`,
                  start: { dateTime: completedAt.toISOString(), timeZone: 'UTC' },
                  end: {
                    dateTime: new Date(completedAt.getTime() + 30 * 60_000).toISOString(),
                    timeZone: 'UTC',
                  },
                }
          await updateGCalEvent(token, syncItem.external_id, updates)
          await supabase
            .from('task_sync_items')
            .update({ status: 'completed' })
            .eq('id', syncItem.id)
        }

        if (nextDueDate) {
          const event = await createGCalEvent(token, task.name, nextDueDate, integration.event_type)
          await supabase.from('task_sync_items').insert({
            task_id: task.id,
            user_id: userId,
            provider: 'google_calendar',
            external_id: event.id,
            status: 'active',
          })
        }
      }
    } catch (err) {
      await supabase
        .from('user_integrations')
        .update({ last_sync_error: String(err) })
        .eq('user_id', userId)
    }
  }
}
