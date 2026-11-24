import { addMonths } from './helpers'

// Turn a paid bill back into a pending one (used by "Undo" and "Reopen").
// Returns a new list; the same list is returned unchanged when there is nothing to do.
//
// When a monthly (recurring) bill is paid, the app creates next month's bill automatically.
// Reopening removes that automatic copy, but only if it is still exactly as it was created:
// pending, same details, due one month later. A copy the user has edited or paid is never touched.
export function reopenBillInList(bills, id) {
  const current = bills.find((b) => b.id === id)
  if (!current || current.status !== 'paid') return bills

  let next = bills.map((b) => (b.id === id ? { ...b, status: 'pending', paidAt: null } : b))

  if (current.recurring) {
    const nextDue = addMonths(current.dueDate, 1)
    const copyIndex = next.findIndex(
      (b) =>
        b.id !== id &&
        b.status !== 'paid' &&
        b.recurring &&
        b.title === current.title &&
        b.category === current.category &&
        b.amount === current.amount &&
        b.dueDate === nextDue
    )
    if (copyIndex !== -1) next = next.filter((_, i) => i !== copyIndex)
  }
  return next
}
