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

// Read a date-only string ("2026-11-16") as a calendar date: { y, m, d } (m is 1 to 12).
// Returns null for anything that is not a real "YYYY-MM-DD" date.
// A date-only string has no time zone, so it must never be run through new Date("2026-11-16"),
// which means "midnight UTC" and shows as the previous day in time zones west of UTC.
export const parseDateOnly = (dateString) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString || '')
  if (!match) return null
  const [y, m, d] = match.slice(1).map(Number)
  const check = new Date(y, m - 1, d)
  const real = check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d
  return real ? { y, m, d } : null
}

// Format "2026-11-16" -> "16 Nov 2026" (the same calendar date in every time zone)
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  const parts = parseDateOnly(dateString)
  // Anything that is not a plain date keeps the previous behaviour
  const date = parts ? new Date(parts.y, parts.m - 1, parts.d) : new Date(dateString)
  return date.toLocaleDateString('en-IN', {
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
  const DAY = 1000 * 60 * 60 * 24
  // Count whole calendar days using UTC day numbers, so time zones and daylight saving never matter
  const dayNumber = (str) => {
    const p = parseDateOnly(str)
    return p ? Date.UTC(p.y, p.m - 1, p.d) : new Date(str).getTime()
  }
  return Math.round((dayNumber(dateString) - dayNumber(todayString())) / DAY)
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
