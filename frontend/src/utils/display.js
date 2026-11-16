import { Receipt, FileText, Repeat, CheckSquare, CalendarDays } from 'lucide-react'
import { daysUntil } from './helpers'

// One icon and one color tone for each kind of item.
export const KIND_ICONS = {
  bill: Receipt,
  document: FileText,
  subscription: Repeat,
  task: CheckSquare,
  appointment: CalendarDays,
}

export const KIND_TONES = {
  bill: 'warning',
  document: 'primary',
  subscription: 'neutral',
  task: 'success',
  appointment: 'primary',
}

const ACTION_TEXT = {
  added: 'Added',
  updated: 'Updated',
  deleted: 'Deleted',
  paid: 'Paid',
  completed: 'Completed',
  reopened: 'Reopened',
  renewed: 'Renewed',
}

// { type: 'bill', action: 'paid', title: 'Water bill' } -> 'Paid bill "Water bill"'
export const describeActivity = (entry) =>
  `${ACTION_TEXT[entry.action] || entry.action} ${entry.type} "${entry.title}"`

// "15:00" -> "3:00 pm"
export function formatTime(time) {
  if (!time) return ''
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// ISO timestamp -> "16 Nov, 3:05 pm"
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

// "Today", "Tomorrow", "In 5 days", "2 days overdue"
export function relativeDays(dateString) {
  const days = daysUntil(dateString)
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

// Which StatusBadge to show for a date: completed, overdue, due within 2 days, or normal.
export function dueStatus(dateString, completed) {
  if (completed) return 'completed'
  const days = daysUntil(dateString)
  if (days < 0) return 'overdue'
  if (days <= 2) return 'soon'
  return 'pending'
}