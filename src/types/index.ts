export type RecurrenceUnit = 'days' | 'weeks' | 'months' | 'years' | 'miles'
export type RecurrenceType = 'time' | 'mileage'

export interface Task {
  id: string
  user_id: string
  name: string
  description: string | null
  category: string | null
  recurrence_type: RecurrenceType
  recurrence_value: number
  recurrence_unit: RecurrenceUnit
  next_due_date: string | null  // ISO date "YYYY-MM-DD"
  next_due_mileage: number | null
  last_logged_mileage: number | null
  is_archived: boolean
  created_at: string
  team_id: string | null
  assigned_to: string | null
}

export interface TaskLog {
  id: string
  task_id: string
  user_id: string
  completed_at: string
  notes: string | null
  mileage_at_completion: number | null
  created_at: string
}

export type DashboardBucket = 'overdue' | 'today' | 'soon' | 'upcoming' | 'mileage'

export interface TaskWithStatus extends Task {
  bucket: DashboardBucket
  days_overdue?: number
  days_until_due?: number
  miles_remaining?: number
}

export interface UserIntegration {
  id: string
  user_id: string
  provider: 'trello' | 'google_calendar'
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  trello_board_id: string | null
  trello_board_name: string | null
  trello_list_id: string | null
  trello_list_name: string | null
  event_type: 'all_day' | 'timed'
  is_active: boolean
  last_sync_error: string | null
  created_at: string
}

export interface TaskSyncItem {
  id: string
  task_id: string
  user_id: string
  provider: string
  external_id: string
  status: 'active' | 'completed'
  created_at: string
}
