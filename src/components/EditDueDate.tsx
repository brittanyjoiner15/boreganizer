'use client'

import { useState } from 'react'
import { updateDueDate } from '@/app/actions/tasks'

interface Props {
  taskId: string
  currentDueDate: string // YYYY-MM-DD
}

export default function EditDueDate({ taskId, currentDueDate }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const newDate = e.target.value
    if (!newDate || newDate === currentDueDate) {
      setEditing(false)
      return
    }
    setSaving(true)
    await updateDueDate(taskId, newDate)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-violet-500 hover:text-violet-700 font-semibold mt-0.5"
      >
        Edit date
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <input
        type="date"
        defaultValue={currentDueDate}
        onBlur={handleBlur}
        disabled={saving}
        className="text-sm border border-stone-200 rounded-lg px-2 py-1 bg-white disabled:opacity-40"
        autoFocus
      />
      {saving && <span className="text-xs text-stone-400">Saving...</span>}
      {!saving && (
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
