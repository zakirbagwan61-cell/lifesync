import { daysUntil } from './helpers'
import { buildReminders, groupReminders } from './reminders'

// The four lists behind the Dashboard's "Needs attention" panel. They are built from the same
// reminders as the Reminders page, so snoozed and completed items are left out and every item
// appears once per list.
//   today   - due today; appointments first (by time), then everything else
//   week    - due today up to 7 days from now
//   overdue - already past
//   all     - overdue, then everything upcoming
export function buildAttentionLists({ bills, documents, subscriptions, tasks, appointments }, snoozes) {
  const groups = groupReminders(buildReminders({ bills, documents, subscriptions, tasks, appointments }), snoozes)

  const timeOf = Object.fromEntries(appointments.map((a) => [`appointment-${a.id}`, a.time || '']))
  const today = groups.upcoming
    .filter((r) => daysUntil(r.date) === 0)
    .sort((a, b) => {
      const aAppt = a.kind === 'appointment'
      const bAppt = b.kind === 'appointment'
      if (aAppt !== bAppt) return aAppt ? -1 : 1
      return aAppt ? (timeOf[a.id] || '').localeCompare(timeOf[b.id] || '') : 0
    })

  return {
    today,
    week: groups.upcoming.filter((r) => daysUntil(r.date) <= 7),
    overdue: groups.overdue,
    all: [...groups.overdue, ...groups.upcoming],
  }
}

// The Bills chip: keep only bill reminders.
export const onlyBills = (list) => list.filter((r) => r.kind === 'bill')
