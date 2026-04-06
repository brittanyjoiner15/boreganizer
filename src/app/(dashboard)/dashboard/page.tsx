import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSection from '@/components/DashboardSection'
import { getDaysUntil } from '@/lib/recurrence'
import type { Task, TaskWithStatus, DashboardBucket } from '@/types'

function getTasksWithStatus(tasks: Task[], userId: string, showAll: boolean): TaskWithStatus[] {
  return tasks
    .filter((task) => {
      if (showAll) return true
      // "Mine": personal tasks + tasks assigned to me + unassigned household tasks
      if (!task.team_id) return true
      if (!task.assigned_to) return true
      return task.assigned_to === userId
    })
    .map((task) => {
      if (task.recurrence_type === 'mileage') {
        return {
          ...task,
          bucket: 'mileage' as DashboardBucket,
          miles_remaining:
            task.next_due_mileage && task.last_logged_mileage
              ? task.next_due_mileage - task.last_logged_mileage
              : undefined,
        }
      }

      if (!task.next_due_date) {
        return { ...task, bucket: 'upcoming' as DashboardBucket }
      }

      const days = getDaysUntil(task.next_due_date)

      if (days < 0) return { ...task, bucket: 'overdue' as DashboardBucket, days_overdue: Math.abs(days) }
      if (days === 0) return { ...task, bucket: 'today' as DashboardBucket }
      if (days <= 7) return { ...task, bucket: 'soon' as DashboardBucket, days_until_due: days }
      return { ...task, bucket: 'upcoming' as DashboardBucket, days_until_due: days }
    })
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch team membership
  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id, teams(name)')
    .eq('user_id', user.id)
    .single()

  const teamId = membership?.team_id ?? null

  // Fetch team members for assignee display
  let teamMembers: { user_id: string; email: string }[] = []
  if (teamId) {
    const { data } = await supabase
      .from('team_members')
      .select('user_id, email')
      .eq('team_id', teamId)
    teamMembers = data ?? []
  }

  // Fetch all accessible tasks (RLS handles team filtering)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_archived', false)
    .order('next_due_date', { ascending: true, nullsFirst: false })

  const allTasks = tasks ?? []
  const tasksWithStatus = getTasksWithStatus(allTasks, user.id, showAll)

  const overdue = tasksWithStatus.filter((t) => t.bucket === 'overdue')
  const today = tasksWithStatus.filter((t) => t.bucket === 'today')
  const soon = tasksWithStatus.filter((t) => t.bucket === 'soon')
  const upcoming = tasksWithStatus.filter((t) => t.bucket === 'upcoming')
  const mileage = tasksWithStatus.filter((t) => t.bucket === 'mileage')
  const isEmpty = tasksWithStatus.length === 0

  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-800">Boreganizer</h1>
          <p className="text-sm text-stone-400 font-medium">
            {overdue.length > 0
              ? `${overdue.length} thing${overdue.length === 1 ? '' : 's'} need attention`
              : today.length > 0
              ? `${today.length} thing${today.length === 1 ? '' : 's'} due today`
              : "You're all caught up!"}
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-md hover:bg-violet-700 transition-colors"
        >
          <span className="text-xl font-bold leading-none">+</span>
        </Link>
      </div>

      {/* Mine / All toggle — only show if in a household */}
      {teamId && (
        <div className="flex bg-stone-100 rounded-xl p-1 mb-6">
          <Link
            href="/dashboard"
            className={`flex-1 text-center text-sm font-bold py-2 rounded-lg transition-colors ${
              !showAll ? 'bg-white text-violet-700 shadow-sm' : 'text-stone-400'
            }`}
          >
            Mine
          </Link>
          <Link
            href="/dashboard?view=all"
            className={`flex-1 text-center text-sm font-bold py-2 rounded-lg transition-colors ${
              showAll ? 'bg-white text-violet-700 shadow-sm' : 'text-stone-400'
            }`}
          >
            All
          </Link>
        </div>
      )}

      {allTasks.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🗂️</div>
          <h2 className="text-xl font-extrabold text-stone-700 mb-2">Nothing here yet!</h2>
          <p className="text-stone-400 text-sm mb-6">Add your first recurring task to get started.</p>
          <Link
            href="/tasks/new"
            className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Add your first task
          </Link>
        </div>
      ) : (
        <div className="space-y-7">
          <DashboardSection bucket="overdue" tasks={overdue} teamMembers={teamMembers} currentUserId={user.id} />
          <DashboardSection bucket="today" tasks={today} teamMembers={teamMembers} currentUserId={user.id} />
          <DashboardSection bucket="soon" tasks={soon} teamMembers={teamMembers} currentUserId={user.id} />
          <DashboardSection bucket="upcoming" tasks={upcoming} teamMembers={teamMembers} currentUserId={user.id} />
          <DashboardSection bucket="mileage" tasks={mileage} teamMembers={teamMembers} currentUserId={user.id} />

          {isEmpty && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-stone-500 font-semibold">All caught up!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
