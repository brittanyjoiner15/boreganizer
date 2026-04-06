'use client'

import { deleteTask } from '@/app/actions/tasks'

export default function DeleteTaskButton({ taskId }: { taskId: string }) {
  async function handleDelete() {
    if (!confirm('Delete this task and all its history? This cannot be undone.')) return
    await deleteTask(taskId)
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="w-full py-3 rounded-xl text-rose-500 font-semibold text-sm hover:bg-rose-50 transition-colors"
    >
      Delete task
    </button>
  )
}
