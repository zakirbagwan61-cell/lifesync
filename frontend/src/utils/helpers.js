// Small reusable helpers used across the app.

// Unique id for new items (bills, tasks, ...).
export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// Format a number as Indian Rupees: 1500 -> "₹1,500"
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

// Format "2026-11-16" -> "16 Nov 2026"
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Today's date as "YYYY-MM-DD" (the format <input type="date"> uses).
export const todayString = () => {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// How many days from today until a date.
// Negative = already passed (overdue), 0 = today, positive = upcoming.
export const daysUntil = (dateString) => {
  if (!dateString) return null
  const target = new Date(dateString)
  const today = new Date(todayString())
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

export const isOverdue = (dateString) => {
  const days = daysUntil(dateString)
  return days !== null && days < 0
}

// ----- Date helpers added in Phase 3 -----
const pad = (n) => String(n).padStart(2, '0')

// Date object -> "YYYY-MM-DD"
export const toDateString = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// "2026-11-16" + 5 days -> "2026-11-21"
export const addDays = (dateString, days) => {
  const [y, m, d] = dateString.split('-').map(Number)
  return toDateString(new Date(y, m - 1, d + days))
}

// "2026-01-31" + 1 month -> "2026-02-28" (keeps the day inside the shorter month)
export const addMonths = (dateString, months) => {
  const [y, m, d] = dateString.split('-').map(Number)
  const lastDay = new Date(y, m - 1 + months + 1, 0).getDate()
  return toDateString(new Date(y, m - 1 + months, Math.min(d, lastDay)))
}
