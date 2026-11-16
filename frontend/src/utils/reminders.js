import { daysUntil } from './helpers'
import { formatCurrency } from './helpers'
import { formatTime } from './display'

// How many days before its date an item starts showing as "upcoming".
export const LEAD_DAYS = { bill: 30, subscription: 30, document: 60, task: 30, appointment: 30 }

// Turn all the app's data into one flat list of reminders.
// Each reminder: { id, kind, sourceId, title, label, detail, date, completed }
export function buildReminders({ bills, documents, subscriptions, tasks, appointments }) {
  const list = []

  bills.forEach((b) =>
    list.push({
      id: `bill-${b.id}`,
      kind: 'bill',
      sourceId: b.id,
      title: b.title,
      label: 'Bill due',
      detail: formatCurrency(b.amount),
      date: b.dueDate,
      completed: b.status === 'paid',
    })
  )

  // Only documents that have an expiry date create reminders.
  documents
    .filter((d) => d.expiryDate)
    .forEach((d) =>
      list.push({
        id: `document-${d.id}`,
        kind: 'document',
        sourceId: d.id,
        title: `${d.type} (${d.holder})`,
        label: 'Document expires',
        detail: '',
        date: d.expiryDate,
        completed: false,
      })
    )

  subscriptions.forEach((s) =>
    list.push({
      id: `subscription-${s.id}`,
      kind: 'subscription',
      sourceId: s.id,
      title: s.name,
      label: 'Subscription renews',
      detail: `${formatCurrency(s.cost)} / ${s.cycle === 'Yearly' ? 'year' : 'month'}`,
      date: s.nextRenewal,
      completed: false,
    })
  )

  tasks.forEach((t) =>
    list.push({
      id: `task-${t.id}`,
      kind: 'task',
      sourceId: t.id,
      title: t.title,
      label: 'Task due',
      detail: `${t.priority} priority`,
      date: t.deadline,
      completed: t.completed,
    })
  )

  appointments.forEach((a) =>
    list.push({
      id: `appointment-${a.id}`,
      kind: 'appointment',
      sourceId: a.id,
      title: a.title,
      label: 'Appointment',
      detail: [formatTime(a.time), a.location].filter(Boolean).join(' · '),
      date: a.date,
      completed: a.completed,
    })
  )

  return list
}

// Sort reminders into four groups. `snoozes` looks like { 'bill-123': '2026-11-20' },
// meaning "hide this reminder until that date".
export function groupReminders(reminders, snoozes = {}) {
  const groups = { overdue: [], upcoming: [], snoozed: [], completed: [] }

  reminders.forEach((r) => {
    if (r.completed) {
      groups.completed.push(r)
      return
    }

    const snoozedUntil = snoozes[r.id]
    if (snoozedUntil && daysUntil(snoozedUntil) > 0) {
      groups.snoozed.push({ ...r, snoozedUntil })
      return
    }

    const days = daysUntil(r.date)
    if (days < 0) groups.overdue.push(r)
    else if (days <= LEAD_DAYS[r.kind]) groups.upcoming.push(r)
    // Anything further away than its lead time is not a reminder yet.
  })

  const byDate = (a, b) => a.date.localeCompare(b.date)
  groups.overdue.sort(byDate)
  groups.upcoming.sort(byDate)
  groups.snoozed.sort((a, b) => a.snoozedUntil.localeCompare(b.snoozedUntil))
  groups.completed.sort((a, b) => b.date.localeCompare(a.date)) // most recent first

  return groups
}