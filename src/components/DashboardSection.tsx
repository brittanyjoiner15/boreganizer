import TaskCard from './TaskCard'
import type { TaskWithStatus, DashboardBucket } from '@/types'

interface TeamMember {
  user_id: string
  email: string
}

interface Props {
  bucket: DashboardBucket
  tasks: TaskWithStatus[]
  teamMembers?: TeamMember[]
  currentUserId?: string
}

const sectionConfig: Record<DashboardBucket, { label: string; emoji: string }> = {
  overdue: { label: 'Overdue', emoji: '🚨' },
  today: { label: 'Due today', emoji: '📅' },
  soon: { label: 'Due soon', emoji: '⏳' },
  upcoming: { label: 'Upcoming', emoji: '🗓️' },
  mileage: { label: 'By mileage', emoji: '🚗' },
}

export default function DashboardSection({ bucket, tasks, teamMembers = [], currentUserId }: Props) {
  if (tasks.length === 0) return null

  const { label, emoji } = sectionConfig[bucket]
  const memberMap = Object.fromEntries(teamMembers.map((m) => [m.user_id, m.email]))

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{emoji}</span>
        <h2 className="text-sm font-extrabold text-stone-500 uppercase tracking-wider">{label}</h2>
        <span className="ml-auto text-xs font-bold text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            assigneeEmail={task.assigned_to ? memberMap[task.assigned_to] : undefined}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </section>
  )
}
