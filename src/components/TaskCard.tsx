'use client'

import { useState } from 'react'
import Link from 'next/link'
import CompletionModal from './CompletionModal'
import { formatDueDate, formatRecurrence } from '@/lib/recurrence'
import type { TaskWithStatus } from '@/types'

interface Props {
  task: TaskWithStatus
  assigneeEmail?: string
  currentUserId?: string
}

const bucketStyles = {
  overdue: 'border-rose-200 bg-white',
  today: 'border-orange-200 bg-white',
  soon: 'border-amber-200 bg-white',
  upcoming: 'border-stone-200 bg-white',
  mileage: 'border-blue-200 bg-white',
}

const badgeStyles = {
  overdue: 'bg-rose-100 text-rose-700',
  today: 'bg-orange-100 text-orange-700',
  soon: 'bg-amber-100 text-amber-700',
  upcoming: 'bg-violet-100 text-violet-700',
  mileage: 'bg-blue-100 text-blue-700',
}

export default function TaskCard({ task, assigneeEmail, currentUserId }: Props) {
  const assigneeLabel = assigneeEmail
    ? task.assigned_to === currentUserId ? 'You' : assigneeEmail.split('@')[0]
    : null
  const [showModal, setShowModal] = useState(false)

  const dueLabel = task.recurrence_type === 'mileage'
    ? task.miles_remaining !== undefined
      ? task.miles_remaining <= 0
        ? `${Math.abs(task.miles_remaining).toLocaleString()} mi overdue`
        : `${task.miles_remaining.toLocaleString()} mi remaining`
      : 'Log mileage to track'
    : task.next_due_date
    ? formatDueDate(task.next_due_date)
    : 'No due date'

  return (
    <>
      <div className={`rounded-2xl border-2 p-4 flex items-center gap-3 ${bucketStyles[task.bucket]}`}>
        <button
          onClick={() => setShowModal(true)}
          className="w-8 h-8 rounded-full border-2 border-stone-300 flex-shrink-0 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors active:bg-emerald-100"
          aria-label="Mark as done"
        >
          <span className="text-stone-300 hover:text-emerald-500 text-sm">✓</span>
        </button>

        <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
          <p className="font-bold text-stone-800 truncate">{task.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyles[task.bucket]}`}>
              {dueLabel}
            </span>
            {task.category && (
              <span className="text-xs text-stone-400">{task.category}</span>
            )}
            {assigneeLabel && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                {assigneeLabel}
              </span>
            )}
          </div>
        </Link>

        <Link
          href={`/tasks/${task.id}`}
          className="text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0"
        >
          <span className="text-lg">›</span>
        </Link>
      </div>

      {showModal && (
        <CompletionModal task={task} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
