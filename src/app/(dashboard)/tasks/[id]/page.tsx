import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDueDate, formatRecurrence } from '@/lib/recurrence'
import { archiveTask } from '@/app/actions/tasks'
import DeleteTaskButton from '@/components/DeleteTaskButton'
import AssigneePicker from '@/components/AssigneePicker'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: task }, { data: logs }, { data: membership }] = await Promise.all([
    supabase.from('tasks').select('*').eq('id', id).single(),
    supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', id)
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase.from('team_members').select('team_id').eq('user_id', user.id).single(),
  ])

  let teamMembers: { user_id: string; email: string }[] = []
  if (membership?.team_id) {
    const { data } = await supabase
      .from('team_members')
      .select('user_id, email')
      .eq('team_id', membership.team_id)
    teamMembers = data ?? []
  }

  if (!task) notFound()

  const dueLabel = task.recurrence_type === 'mileage'
    ? task.next_due_mileage
      ? `Due at ${task.next_due_mileage.toLocaleString()} miles`
      : 'No mileage set'
    : task.next_due_date
    ? formatDueDate(task.next_due_date)
    : 'No due date'

  return (
    <div className="pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-stone-400 hover:text-stone-600 text-lg">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold text-stone-800 flex-1 truncate">{task.name}</h1>
        <Link
          href={`/tasks/${id}/edit`}
          className="text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          Edit
        </Link>
      </div>

      {/* Task info card */}
      <div className="bg-white rounded-2xl border-2 border-stone-200 p-5 mb-6 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Next due</p>
            <p className="font-bold text-stone-800">{dueLabel}</p>
          </div>
          {task.category && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-100 text-violet-700">
              {task.category}
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Frequency</p>
          <p className="font-bold text-stone-800">{formatRecurrence(task.recurrence_value, task.recurrence_unit)}</p>
        </div>

        {task.recurrence_type === 'mileage' && task.last_logged_mileage && (
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Last logged mileage</p>
            <p className="font-bold text-stone-800">{task.last_logged_mileage.toLocaleString()} miles</p>
          </div>
        )}

        {teamMembers.length > 0 && (
          <AssigneePicker
            taskId={id}
            teamMembers={teamMembers}
            currentAssignee={task.assigned_to}
            currentUserId={user.id}
          />
        )}

        {task.description && (
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-stone-600 text-sm">{task.description}</p>
          </div>
        )}
      </div>

      {/* Completion history */}
      <div className="mb-6">
        <h2 className="text-sm font-extrabold text-stone-500 uppercase tracking-wider mb-3">
          History {logs && logs.length > 0 && <span className="text-stone-300">({logs.length})</span>}
        </h2>

        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border-2 border-dashed border-stone-200">
            <p className="text-stone-400 text-sm font-medium">No completions logged yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl border border-stone-200 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-700 text-sm">
                      {new Date(log.completed_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {log.mileage_at_completion && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        {log.mileage_at_completion.toLocaleString()} miles
                      </p>
                    )}
                    {log.notes && (
                      <p className="text-xs text-stone-500 mt-1 italic">{log.notes}</p>
                    )}
                  </div>
                  <span className="text-emerald-500 text-lg flex-shrink-0">✓</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="border-t border-stone-200 pt-6 space-y-2">
        <form action={archiveTask.bind(null, id)}>
          <button
            type="submit"
            className="w-full py-3 rounded-xl border-2 border-stone-200 text-stone-500 font-semibold text-sm hover:bg-stone-100 transition-colors"
          >
            Archive task
          </button>
        </form>
        <DeleteTaskButton taskId={id} />
      </div>
    </div>
  )
}
