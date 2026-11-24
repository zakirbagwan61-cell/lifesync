import { daysUntil } from './helpers'

// Snoozes are saved as { 'bill-123': '2026-12-01' } (hidden until that date). Nothing ever removed
// them, so the saved object only grew. A snooze can be dropped safely when
//   - its date has arrived (it no longer hides anything), or
//   - the item it was for no longer exists.
// Returns the same object when nothing needs removing, so callers can skip saving.
export function pruneSnoozes(snoozes, { bills, documents, subscriptions, tasks, appointments }) {
  const existing = new Set([
    ...bills.map((b) => `bill-${b.id}`),
    ...documents.map((d) => `document-${d.id}`), // kept even without an expiry date, which has no reminder
    ...subscriptions.map((s) => `subscription-${s.id}`),
    ...tasks.map((t) => `task-${t.id}`),
    ...appointments.map((a) => `appointment-${a.id}`),
  ])

  let changed = false
  const kept = {}
  Object.entries(snoozes || {}).forEach(([reminderId, until]) => {
    const stillHiding = typeof until === 'string' && daysUntil(until) > 0
    if (stillHiding && existing.has(reminderId)) kept[reminderId] = until
    else changed = true
  })
  return changed ? kept : snoozes
}
