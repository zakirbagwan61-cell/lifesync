import { addMonths, daysUntil, formatCurrency, todayString } from './helpers'
import { DOC_ALERT_DAYS, buildReminders, groupReminders } from './reminders'
import { relativeDays } from './display'

// Pure calculations for the Smart Insights section on the Dashboard.
// Everything is derived from the data in Context; nothing here is stored.

export const KIND_PATHS = {
  bill: '/bills',
  document: '/documents',
  subscription: '/subscriptions',
  task: '/tasks',
  appointment: '/tasks',
}

const sum = (list, pick) => list.reduce((total, item) => total + (Number(pick(item)) || 0), 0)
const monthKey = (dateString) => dateString.slice(0, 7)
const monthName = (key) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long' })

// ----- 1. Spending: this month vs last month (money actually paid, same rule as the Monthly spending chart) -----
export function spendingInsight(bills) {
  const today = todayString()
  const thisKey = monthKey(today)
  const lastKey = monthKey(addMonths(`${thisKey}-01`, -1))
  const paidIn = (key) =>
    sum(bills.filter((b) => b.status === 'paid' && b.paidAt && monthKey(b.paidAt) === key), (b) => b.amount)

  const current = paidIn(thisKey)
  const previous = paidIn(lastKey)
  const lastMonth = monthName(lastKey)

  let state
  let percent = null
  if (current === 0 && previous === 0) state = 'none'
  else if (previous === 0) state = 'first'
  else {
    percent = ((current - previous) / previous) * 100
    state = Math.abs(percent) < 1 ? 'same' : percent > 0 ? 'up' : 'down'
  }

  return { state, current, previous, percent, lastMonth, thisMonth: monthName(thisKey) }
}

// ----- 2. Upcoming responsibilities: everything due in the next 7 days -----
// Reuses buildReminders/groupReminders so snoozed and completed items behave like the Reminders page.
export function upcomingWeek(data, snoozes, days = 7) {
  const groups = groupReminders(buildReminders(data), snoozes)
  const priorityOf = (r) => {
    if (r.kind === 'task') {
      const task = data.tasks.find((t) => t.id === r.sourceId)
      return task ? task.priority.toLowerCase() : 'low'
    }
    const left = daysUntil(r.date)
    return left <= 1 ? 'high' : left <= 3 ? 'medium' : 'low'
  }
  const items = groups.upcoming
    .filter((r) => daysUntil(r.date) <= days)
    .map((r) => ({ ...r, priority: priorityOf(r), when: relativeDays(r.date), path: KIND_PATHS[r.kind] }))
  return { items, overdue: groups.overdue }
}

// ----- 3. Productivity: tasks done vs total, plus a 7-day summary -----
export function productivityInsight(tasks) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.completed).length
  const percent = total ? Math.round((completed / total) * 100) : 0
  const doneThisWeek = tasks.filter(
    (t) => t.completed && t.completedAt && daysUntil(t.completedAt) >= -6 && daysUntil(t.completedAt) <= 0
  ).length
  const dueNextWeek = tasks.filter(
    (t) => !t.completed && daysUntil(t.deadline) >= 0 && daysUntil(t.deadline) <= 7
  ).length
  const overdue = tasks.filter((t) => !t.completed && daysUntil(t.deadline) < 0).length
  return { total, completed, percent, doneThisWeek, dueNextWeek, overdue }
}

// ----- 4. Financial overview: bill amounts by status -----
export function financialInsight(bills) {
  const paid = bills.filter((b) => b.status === 'paid')
  const unpaid = bills.filter((b) => b.status !== 'paid')
  const overdue = unpaid.filter((b) => daysUntil(b.dueDate) < 0)
  const pending = unpaid.filter((b) => daysUntil(b.dueDate) >= 0)
  return {
    hasBills: bills.length > 0,
    paid: { amount: sum(paid, (b) => b.amount), count: paid.length },
    pending: { amount: sum(pending, (b) => b.amount), count: pending.length },
    overdue: { amount: sum(overdue, (b) => b.amount), count: overdue.length },
    outstanding: sum(unpaid, (b) => b.amount),
  }
}

// ----- 5. Recommendations: only from real data, most urgent first, at most `limit` -----
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export function buildRecommendations({ bills, documents, subscriptions, tasks }, spending, limit = 4) {
  const recs = []
  const unpaid = bills.filter((b) => b.status !== 'paid')

  const overdueBills = unpaid.filter((b) => daysUntil(b.dueDate) < 0)
  if (overdueBills.length) {
    recs.push({
      id: 'overdue-bills',
      tone: 'danger',
      title: `${plural(overdueBills.length, 'bill')} overdue`,
      text: `${formatCurrency(sum(overdueBills, (b) => b.amount))} is past due. Pay it soon to avoid late fees.`,
      path: '/bills',
    })
  }

  const nextBill = unpaid
    .filter((b) => daysUntil(b.dueDate) >= 0 && daysUntil(b.dueDate) <= 3)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  if (nextBill) {
    recs.push({
      id: 'bill-soon',
      tone: 'warning',
      title: `${nextBill.title} is due ${relativeDays(nextBill.dueDate).toLowerCase()}`,
      text: `${formatCurrency(nextBill.amount)} is coming up. Mark it as paid once done.`,
      path: '/bills',
    })
  }

  const docs = documents
    .filter((d) => d.expiryDate && daysUntil(d.expiryDate) <= DOC_ALERT_DAYS)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
  if (docs[0]) {
    const left = daysUntil(docs[0].expiryDate)
    recs.push({
      id: 'document',
      tone: left < 0 ? 'danger' : 'warning',
      title: left < 0 ? `${docs[0].type} has expired` : `${docs[0].type} expires ${relativeDays(docs[0].expiryDate).toLowerCase()}`,
      text: docs.length > 1 ? `${plural(docs.length, 'document')} need renewal attention.` : 'Start the renewal so you are not caught out.',
      path: '/documents',
    })
  }

  const overdueTasks = tasks.filter((t) => !t.completed && daysUntil(t.deadline) < 0)
  if (overdueTasks.length) {
    recs.push({
      id: 'overdue-tasks',
      tone: 'warning',
      title: `${plural(overdueTasks.length, 'task')} overdue`,
      text: 'Finish them or move the deadline so your list stays accurate.',
      path: '/tasks',
    })
  }

  const renewal = subscriptions
    .filter((s) => daysUntil(s.nextRenewal) >= 0 && daysUntil(s.nextRenewal) <= 7)
    .sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal))[0]
  if (renewal) {
    recs.push({
      id: 'renewal',
      tone: 'info',
      title: `${renewal.name} renews ${relativeDays(renewal.nextRenewal).toLowerCase()}`,
      text: `${formatCurrency(renewal.cost)} will be charged${renewal.autoRenew ? ' automatically' : ' if you renew'}.`,
      path: '/subscriptions',
    })
  }

  // Only when last month has a real figure to compare against
  if (spending.state === 'up' && spending.percent >= 20) {
    recs.push({
      id: 'spending-up',
      tone: 'info',
      title: 'Spending is higher than last month',
      text: `${formatCurrency(spending.current)} paid so far this month, ${Math.round(spending.percent)}% above ${spending.lastMonth}.`,
      path: '/bills',
    })
  }

  return recs.slice(0, limit)
}
