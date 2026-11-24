import { useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

// Text of the main action button for each kind of reminder.
export const DONE_LABEL = {
  bill: 'Mark paid',
  task: 'Mark done',
  appointment: 'Mark done',
  subscription: 'Mark renewed',
}

// What the Undo message says after each action.
const DONE_MESSAGE = {
  bill: 'marked as paid',
  task: 'marked as done',
  appointment: 'marked as done',
  subscription: 'marked as renewed',
}

// The "finish" and "snooze" actions for a reminder, shared by the Reminders page and the
// Dashboard's Needs attention panel. Every action is one click and offers Undo.
export default function useReminderActions() {
  const {
    subscriptions, snoozeReminder, unsnoozeReminder,
    markBillPaid, reopenBill, toggleTask, toggleAppointment, renewSubscription, updateSubscription,
  } = useApp()
  const toast = useToast()

  // An Undo button can be pressed a few seconds later, so it reads the newest functions from here.
  const latest = useRef({})
  latest.current = { reopenBill, toggleTask, toggleAppointment, updateSubscription, unsnoozeReminder }

  // Run the right action in the right module when the user finishes a reminder.
  const markDone = (r) => {
    let undo
    if (r.kind === 'bill') {
      markBillPaid(r.sourceId)
      undo = () => latest.current.reopenBill(r.sourceId)
    } else if (r.kind === 'task') {
      toggleTask(r.sourceId)
      undo = () => latest.current.toggleTask(r.sourceId) // toggling again puts it back to pending
    } else if (r.kind === 'appointment') {
      toggleAppointment(r.sourceId)
      undo = () => latest.current.toggleAppointment(r.sourceId)
    } else if (r.kind === 'subscription') {
      const previousDate = subscriptions.find((s) => s.id === r.sourceId)?.nextRenewal
      renewSubscription(r.sourceId)
      undo = () => latest.current.updateSubscription(r.sourceId, { nextRenewal: previousDate })
    } else return
    toast({ message: `"${r.title}" ${DONE_MESSAGE[r.kind]}`, onAction: undo })
  }

  // Snoozing hides a reminder for a while; Undo brings it straight back.
  const snooze = (r, days) => {
    snoozeReminder(r.id, days)
    toast({
      message: `"${r.title}" snoozed for ${days === 30 ? '1 month' : days === 7 ? '1 week' : `${days} day${days === 1 ? '' : 's'}`}`,
      onAction: () => latest.current.unsnoozeReminder(r.id),
    })
  }

  return { markDone, snooze }
}
