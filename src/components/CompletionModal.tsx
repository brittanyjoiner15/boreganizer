'use client'

import { useState, useActionState } from 'react'
import { completeTask } from '@/app/actions/tasks'
import type { Task } from '@/types'

interface Props {
  task: Task
  onClose: () => void
}

type State = { error: string | undefined; success: boolean }
const initialState: State = { error: undefined, success: false }

export default function CompletionModal({ task, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await completeTask(formData)
      if (result?.success) {
        onClose()
        return initialState
      }
      return { error: result?.error, success: false }
    },
    initialState
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-stone-800">Mark as done</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-2xl leading-none">&times;</button>
        </div>

        <p className="text-stone-600 font-semibold mb-5">{task.name}</p>

        {state.error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="task_id" value={task.id} />

          {task.recurrence_type === 'mileage' && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Current mileage <span className="text-rose-500">*</span>
              </label>
              <input
                name="mileage"
                type="number"
                required
                min={0}
                placeholder="e.g. 45000"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {task.last_logged_mileage && (
                <p className="text-xs text-stone-400 mt-1">
                  Last logged at {task.last_logged_mileage.toLocaleString()} miles
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Notes <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Any details worth remembering..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {isPending ? 'Saving...' : '✓ Done!'}
          </button>
        </form>
      </div>
    </div>
  )
}
