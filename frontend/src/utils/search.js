import { formatCurrency } from './helpers'
import { formatTime } from './display'
import { maskNumber } from './privacy'
import { KIND_PATHS } from './insights'

// Turn every item from every module into one flat, searchable list.
// Each entry: { id, sourceId, kind, title, meta, date, completed, text }
// `text` is all the words that are searched, in lowercase. `date` is what the list sorts by and
// shows a status badge for (due date, expiry date, renewal date, deadline, appointment date).
export function buildSearchItems({ bills, documents, subscriptions, tasks, appointments }) {
  return [
    ...bills.map((b) => ({
      id: `bill-${b.id}`, sourceId: b.id, kind: 'bill', title: b.title,
      meta: `${b.category} · ${formatCurrency(b.amount)}`,
      date: b.dueDate, completed: b.status === 'paid',
      text: [b.title, b.category, b.amount].join(' ').toLowerCase(),
    })),
    ...documents.map((d) => ({
      id: `document-${d.id}`, sourceId: d.id, kind: 'document', title: `${d.type} (${d.holder})`,
      // The full number is still searchable (see `text`), but only a masked version is shown.
      meta: maskNumber(d.number),
      date: d.expiryDate, completed: false,
      text: [d.type, d.holder, d.number, d.notes].join(' ').toLowerCase(),
    })),
    ...subscriptions.map((s) => ({
      id: `subscription-${s.id}`, sourceId: s.id, kind: 'subscription', title: s.name,
      meta: `${formatCurrency(s.cost)} / ${s.cycle === 'Yearly' ? 'year' : 'month'}`,
      date: s.nextRenewal, completed: false,
      text: [s.name, s.cycle, s.cost].join(' ').toLowerCase(),
    })),
    ...tasks.map((t) => ({
      id: `task-${t.id}`, sourceId: t.id, kind: 'task', title: t.title,
      meta: `${t.priority} priority`, date: t.deadline, completed: t.completed,
      text: [t.title, t.priority].join(' ').toLowerCase(),
    })),
    ...appointments.map((a) => ({
      id: `appointment-${a.id}`, sourceId: a.id, kind: 'appointment', title: a.title,
      meta: [formatTime(a.time), a.location].filter(Boolean).join(' · '),
      date: a.date, completed: a.completed,
      text: [a.title, a.location].join(' ').toLowerCase(),
    })),
  ]
}

// Items whose text contains the query (case-insensitive). An empty query matches nothing.
export function filterSearchItems(items, query) {
  const q = String(query ?? '').trim().toLowerCase()
  return q ? items.filter((i) => i.text.includes(q)) : []
}

// Earliest date first; items without a date go last.
export const sortSearchResults = (results) =>
  [...results].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))

// Where "open this result" goes: the item's page, with ?focus so that page highlights the exact item.
// Appointments share the Tasks page, so they also name their tab.
export function searchItemPath(item) {
  const base = `${KIND_PATHS[item.kind]}?focus=${encodeURIComponent(item.sourceId)}`
  return item.kind === 'appointment' ? `${base}&tab=appointments` : base
}

// Best matches first for the live suggestions: a title that starts with the query, then a title
// that contains it, then matches found only in other fields. Ties go by date (earliest first).
export function rankSearchResults(results, query) {
  const q = String(query ?? '').trim().toLowerCase()
  const score = (r) => {
    const title = r.title.toLowerCase()
    if (title.startsWith(q)) return 0
    if (title.includes(q)) return 1
    return 2
  }
  return [...results].sort(
    (a, b) => score(a) - score(b) || (a.date || '9999').localeCompare(b.date || '9999')
  )
}
