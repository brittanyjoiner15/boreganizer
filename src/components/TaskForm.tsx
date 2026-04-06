'use client'

import { useState } from 'react'
import type { Task } from '@/types'

interface TeamMember {
  user_id: string
  email: string
}

interface Props {
  task?: Task
  action: (formData: FormData) => Promise<{ error?: string } | void>
  submitLabel: string
  teamId?: string
  teamMembers?: TeamMember[]
  currentUserId?: string
}

const PRESET_OPTIONS = [
  { label: 'Daily', value: '1', unit: 'days' },
  { label: 'Weekly', value: '1', unit: 'weeks' },
  { label: 'Monthly', value: '1', unit: 'months' },
  { label: 'Every 3 months', value: '3', unit: 'months' },
  { label: 'Every 6 months', value: '6', unit: 'months' },
  { label: 'Yearly', value: '1', unit: 'years' },
  { label: 'Custom', value: 'custom', unit: '' },
  { label: 'By mileage', value: 'mileage', unit: 'miles' },
]

const CATEGORIES = ['Cleaning', 'Car', 'Pets', 'Health', 'Home', 'Garden', 'Other']

function getInitialPreset(task?: Task): string {
  if (!task) return '1-weeks'
  if (task.recurrence_type === 'mileage') return 'mileage'
  const key = `${task.recurrence_value}-${task.recurrence_unit}`
  const presets = ['1-days', '1-weeks', '1-months', '3-months', '6-months', '1-years']
  return presets.includes(key) ? key : 'custom'
}

export default function TaskForm({ task, action, submitLabel, teamId, teamMembers = [], currentUserId }: Props) {
  const hasTeam = !!teamId
  const initialPreset = getInitialPreset(task)
  const [preset, setPreset] = useState(initialPreset)
  const [isHousehold, setIsHousehold] = useState(!!task?.team_id)
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)

  const isMileage = preset === 'mileage'
  const isCustom = preset === 'custom'

  const selectedPreset = PRESET_OPTIONS.find(
    (p) => (p.value !== 'custom' && p.value !== 'mileage')
      ? `${p.value}-${p.unit}` === preset
      : p.value === preset
  )

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(undefined)

    if (isMileage) {
      formData.set('recurrence_type', 'mileage')
      formData.set('recurrence_unit', 'miles')
    } else if (isCustom) {
      formData.set('recurrence_type', 'time')
    } else if (selectedPreset) {
      formData.set('recurrence_type', 'time')
      formData.set('recurrence_value', selectedPreset.value)
      formData.set('recurrence_unit', selectedPreset.unit)
    }

    const result = await action(formData)
    setIsPending(false)
    if (result?.error) setError(result.error)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
          Task name <span className="text-rose-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={task?.name}
          placeholder="e.g. Clean bathroom"
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Category</label>
        <select
          name="category"
          defaultValue={task?.category ?? ''}
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">No category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-2">How often?</label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_OPTIONS.map((option) => {
            const key = option.value === 'custom' || option.value === 'mileage'
              ? option.value
              : `${option.value}-${option.unit}`
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  preset === key
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {isCustom && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Every</label>
            <input
              name="recurrence_value"
              type="number"
              required
              min={1}
              defaultValue={task?.recurrence_value}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Unit</label>
            <select
              name="recurrence_unit"
              defaultValue={task?.recurrence_unit ?? 'weeks'}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </div>
      )}

      {isMileage && (
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Miles between service <span className="text-rose-500">*</span>
          </label>
          <input
            name="recurrence_value"
            type="number"
            required
            min={1}
            defaultValue={task?.recurrence_value}
            placeholder="e.g. 5000"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {!task && (
            <div className="mt-3">
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Due at mileage <span className="text-stone-400 font-normal">(optional — what mileage is it next due?)</span>
              </label>
              <input
                name="start_mileage"
                type="number"
                min={0}
                placeholder="e.g. 50000"
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}
        </div>
      )}

      {!isMileage && !task && (
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            First due date <span className="text-stone-400 font-normal">(leave blank for today)</span>
          </label>
          <input
            name="start_date"
            type="date"
            defaultValue={today}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
          Notes <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <textarea
          name="description"
          rows={2}
          defaultValue={task?.description ?? ''}
          placeholder="Any extra details..."
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>

      {hasTeam && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsHousehold(!isHousehold)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
              isHousehold
                ? 'border-violet-500 bg-violet-50'
                : 'border-stone-200 bg-white'
            }`}
          >
            <span className="font-semibold text-sm text-stone-700">Household task</span>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${isHousehold ? 'bg-violet-500' : 'bg-stone-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isHousehold ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </button>

          {isHousehold && (
            <>
              <input type="hidden" name="team_id" value={teamId} />
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Assign to <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <select
                  name="assigned_to"
                  defaultValue={task?.assigned_to ?? ''}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Anyone</option>
                  {teamMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.email.split('@')[0]}{m.user_id === currentUserId ? ' (you)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {isPending ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
