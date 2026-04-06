import type { RecurrenceUnit } from '@/types'

export function getNextDueDate(completedAt: Date, value: number, unit: RecurrenceUnit): Date {
  const next = new Date(completedAt)
  switch (unit) {
    case 'days':
      next.setDate(next.getDate() + value)
      break
    case 'weeks':
      next.setDate(next.getDate() + value * 7)
      break
    case 'months':
      next.setMonth(next.getMonth() + value)
      break
    case 'years':
      next.setFullYear(next.getFullYear() + value)
      break
  }
  return next
}

export function formatRecurrence(value: number, unit: RecurrenceUnit): string {
  if (unit === 'miles') return `Every ${value.toLocaleString()} miles`
  if (value === 1) {
    const singular: Record<string, string> = {
      days: 'Daily',
      weeks: 'Weekly',
      months: 'Monthly',
      years: 'Yearly',
    }
    return singular[unit] ?? `Every ${value} ${unit}`
  }
  return `Every ${value} ${unit}`
}

export function formatDueDate(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  const diffMs = due.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return `In ${diffDays} days`
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}
