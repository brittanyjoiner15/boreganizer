'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNextDueDate, toDateString } from '@/lib/recurrence'
import { syncOnCreate, syncOnComplete, syncUpdateDueDate } from '@/lib/sync'
import type { RecurrenceUnit } from '@/types'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const recurrenceType = formData.get('recurrence_type') as string
  const recurrenceValue = parseInt(formData.get('recurrence_value') as string, 10)
  const recurrenceUnit = formData.get('recurrence_unit') as RecurrenceUnit
  const startDate = formData.get('start_date') as string

  const isMileage = recurrenceType === 'mileage'

  const teamId = (formData.get('team_id') as string) || null
  const assignedTo = (formData.get('assigned_to') as string) || null

  const taskData = {
    user_id: user.id,
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    category: (formData.get('category') as string) || null,
    recurrence_type: isMileage ? 'mileage' : 'time',
    recurrence_value: recurrenceValue,
    recurrence_unit: isMileage ? 'miles' : recurrenceUnit,
    next_due_date: isMileage ? null : (startDate || toDateString(new Date())),
    next_due_mileage: isMileage ? (parseInt(formData.get('start_mileage') as string, 10) || null) : null,
    last_logged_mileage: null,
    team_id: teamId,
    assigned_to: assignedTo,
  }

  const { data: task, error } = await supabase.from('tasks').insert(taskData).select().single()
  if (error) return { error: error.message }

  await syncOnCreate(supabase, task, user.id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateTask(taskId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const recurrenceType = formData.get('recurrence_type') as string
  const recurrenceValue = parseInt(formData.get('recurrence_value') as string, 10)
  const recurrenceUnit = formData.get('recurrence_unit') as RecurrenceUnit
  const isMileage = recurrenceType === 'mileage'

  const assignedTo = (formData.get('assigned_to') as string) || null

  const updates = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    category: (formData.get('category') as string) || null,
    recurrence_type: isMileage ? 'mileage' : 'time',
    recurrence_value: recurrenceValue,
    recurrence_unit: isMileage ? 'miles' : recurrenceUnit,
    assigned_to: assignedTo,
  }

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/tasks/${taskId}`)
  redirect(`/tasks/${taskId}`)
}

export async function completeTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const taskId = formData.get('task_id') as string
  const notes = (formData.get('notes') as string) || null
  const mileageInput = formData.get('mileage') as string
  const mileage = mileageInput ? parseInt(mileageInput, 10) : null
  const completedAt = new Date()

  // Fetch the task (RLS handles access control)
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (taskError || !task) return { error: 'Task not found' }

  // Log the completion
  const { error: logError } = await supabase.from('task_logs').insert({
    task_id: taskId,
    user_id: user.id,
    completed_at: completedAt.toISOString(),
    notes,
    mileage_at_completion: mileage,
  })

  if (logError) return { error: logError.message }

  // Update next due date/mileage
  let taskUpdate: Record<string, unknown> = {}
  let nextDueDateStr: string | null = null

  if (task.recurrence_type === 'mileage' && mileage !== null) {
    taskUpdate = {
      last_logged_mileage: mileage,
      next_due_mileage: mileage + task.recurrence_value,
    }
  } else if (task.recurrence_type === 'time') {
    const nextDue = getNextDueDate(completedAt, task.recurrence_value, task.recurrence_unit)
    nextDueDateStr = toDateString(nextDue)
    taskUpdate = { next_due_date: nextDueDateStr }
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .eq('id', taskId)

  if (updateError) return { error: updateError.message }

  await syncOnComplete(supabase, task, user.id, nextDueDateStr, completedAt)

  revalidatePath('/dashboard')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

export async function updateDueDate(taskId: string, newDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: task, error } = await supabase
    .from('tasks')
    .update({ next_due_date: newDate })
    .eq('id', taskId)
    .select()
    .single()

  if (error) return { error: error.message }

  await syncUpdateDueDate(supabase, task, user.id, newDate)

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function assignTask(taskId: string, assignedTo: string | null): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('tasks')
    .update({ assigned_to: assignedTo })
    .eq('id', taskId)

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/dashboard')
}

export async function archiveTask(taskId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('tasks')
    .update({ is_archived: true })
    .eq('id', taskId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
