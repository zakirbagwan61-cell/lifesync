import { daysUntil } from '../../utils/helpers'

// Pure functions that turn the app's bills and tasks into chart data.
// Nothing here is stored: charts are recalculated from Context on every change.

const pad = (n) => String(n).padStart(2, '0')

// A run of calendar months around today: `back` months before, this month, `ahead` after.
export function monthWindow(back, ahead = 0) {
  const now = new Date()
  const months = []
  for (let i = -back; i <= ahead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push({
      key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      full: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    })
  }
  return months
}

// Money actually paid per month (bills marked as paid, grouped by the month they were paid).
export function spendingByMonth(bills, months) {
  const totals = Object.fromEntries(months.map((m) => [m.key, 0]))
  let hidden = 0
  bills.forEach((b) => {
    if (b.status !== 'paid' || !b.paidAt) return
    const key = b.paidAt.slice(0, 7)
    if (key in totals) totals[key] += Number(b.amount) || 0
    else hidden += 1
  })
  return {
    data: months.map((m) => ({ label: m.label, full: m.full, value: totals[m.key] })),
    hidden,
  }
}

// Amount per category. mode "paid" = paid bills only, "all" = every bill (paid and unpaid).
export function spendingByCategory(bills, mode) {
  const totals = {}
  bills.forEach((b) => {
    if (mode === 'paid' && b.status !== 'paid') return
    const category = b.category || 'Other'
    totals[category] = (totals[category] || 0) + (Number(b.amount) || 0)
  })
  return Object.entries(totals)
    .filter(([, value]) => value > 0)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

// Paid / pending / overdue, using the same rule as the Bills page (unpaid and past due = overdue).
export function paymentStatus(bills) {
  const result = { paid: 0, pending: 0, overdue: 0 }
  bills.forEach((b) => {
    if (b.status === 'paid') result.paid += 1
    else if (daysUntil(b.dueDate) < 0) result.overdue += 1
    else result.pending += 1
  })
  return result
}

// Tasks per month: completed (by the month they were completed) vs pending (by deadline month).
export function tasksByMonth(tasks, months) {
  const rows = Object.fromEntries(months.map((m) => [m.key, { completed: 0, pending: 0 }]))
  let hidden = 0
  tasks.forEach((t) => {
    const date = t.completed ? t.completedAt : t.deadline
    const key = date ? date.slice(0, 7) : null
    if (key && key in rows) rows[key][t.completed ? 'completed' : 'pending'] += 1
    else hidden += 1
  })
  return {
    data: months.map((m) => ({
      label: m.label,
      full: m.full,
      completed: rows[m.key].completed,
      pending: rows[m.key].pending,
    })),
    hidden,
  }
}

// Round an axis maximum up to a "nice" number and return the tick values.
export function niceScale(max, { ticks = 4, integer = false } = {}) {
  const safeMax = max > 0 ? max : integer ? 4 : 1000
  let raw = safeMax / ticks
  if (integer) raw = Math.max(1, Math.ceil(raw))
  const pow = 10 ** Math.floor(Math.log10(raw))
  let step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)
  if (integer) step = Math.ceil(step)
  const count = Math.ceil(safeMax / step)
  return {
    top: count * step,
    values: Array.from({ length: count + 1 }, (_, i) => i * step),
  }
}

// Short rupee labels for the axis: 1500 -> ₹1.5k, 150000 -> ₹1.5L
export function formatAxisMoney(v) {
  if (v === 0) return '₹0'
  const trim = (n) => String(Number(n.toFixed(1)))
  if (v >= 100000) return `₹${trim(v / 100000)}L`
  if (v >= 1000) return `₹${trim(v / 1000)}k`
  return `₹${v}`
}
