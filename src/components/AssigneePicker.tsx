'use client'

import { useState, useTransition } from 'react'
import { assignTask } from '@/app/actions/tasks'

interface Member {
  user_id: string
  email: string
}

interface Props {
  taskId: string
  teamMembers: Member[]
  currentAssignee: string | null
  currentUserId: string
}

export default function AssigneePicker({ taskId, teamMembers, currentAssignee, currentUserId }: Props) {
  const [assignedTo, setAssignedTo] = useState<string | null>(currentAssignee)
  const [isPending, startTransition] = useTransition()

  function labelFor(userId: string | null) {
    if (!userId) return 'Anyone'
    const member = teamMembers.find((m) => m.user_id === userId)
    if (!member) return 'Anyone'
    const name = member.email.split('@')[0]
    return userId === currentUserId ? `${name} (you)` : name
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value || null
    setAssignedTo(val)
    startTransition(() => assignTask(taskId, val))
  }

  return (
    <div>
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Assigned to</p>
      <select
        value={assignedTo ?? ''}
        onChange={handleChange}
        disabled={isPending}
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
      >
        <option value="">Anyone</option>
        {teamMembers.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.email.split('@')[0]}{m.user_id === currentUserId ? ' (you)' : ''}
          </option>
        ))}
      </select>
      {isPending && <p className="text-xs text-stone-400 mt-1">Saving...</p>}
    </div>
  )
}
