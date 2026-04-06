import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TaskForm from '@/components/TaskForm'
import { updateTask } from '@/app/actions/tasks'

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: task }, { data: membership }] = await Promise.all([
    supabase.from('tasks').select('*').eq('id', id).single(),
    supabase.from('team_members').select('team_id').eq('user_id', user.id).single(),
  ])

  if (!task) notFound()

  let teamMembers: { user_id: string; email: string }[] = []
  if (membership?.team_id) {
    const { data } = await supabase
      .from('team_members')
      .select('user_id, email')
      .eq('team_id', membership.team_id)
    teamMembers = data ?? []
  }

  const boundUpdateTask = updateTask.bind(null, id)

  return (
    <div className="pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/tasks/${id}`} className="text-stone-400 hover:text-stone-600 text-lg">←</Link>
        <h1 className="text-2xl font-extrabold text-stone-800">Edit task</h1>
      </div>

      <TaskForm
        task={task}
        action={boundUpdateTask}
        submitLabel="Save changes"
        teamId={membership?.team_id ?? undefined}
        teamMembers={teamMembers}
        currentUserId={user.id}
      />
    </div>
  )
}
