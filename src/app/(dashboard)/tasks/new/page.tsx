import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TaskForm from '@/components/TaskForm'
import { createTask } from '@/app/actions/tasks'

export default async function NewTaskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  let teamMembers: { user_id: string; email: string }[] = []
  if (membership?.team_id) {
    const { data } = await supabase
      .from('team_members')
      .select('user_id, email')
      .eq('team_id', membership.team_id)
    teamMembers = data ?? []
  }

  return (
    <div className="pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-stone-400 hover:text-stone-600 text-lg">←</Link>
        <h1 className="text-2xl font-extrabold text-stone-800">New task</h1>
      </div>

      <TaskForm
        action={createTask}
        submitLabel="Add task"
        teamId={membership?.team_id ?? undefined}
        teamMembers={teamMembers}
        currentUserId={user.id}
      />
    </div>
  )
}
