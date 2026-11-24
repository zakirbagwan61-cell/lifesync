import { addDays, todayString } from './helpers'
import { searchItemPath } from './search'

// The Activity History keeps this many of the newest entries; older ones are dropped automatically.
export const MAX_ACTIVITY = 200

// "2026-11-24T05:35:00.000Z" -> the user's local calendar day, "2026-11-24"
export function localDay(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// Heading for a day: "Today", "Yesterday", or e.g. "Monday, 17 November" (with the year when it is not this year).
export function dayLabel(dayKey, today = todayString()) {
  if (!dayKey) return 'Earlier'
  if (dayKey === today) return 'Today'
  if (dayKey === addDays(today, -1)) return 'Yesterday'
  const [y, m, d] = dayKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', ...(y === Number(today.slice(0, 4)) ? {} : { year: 'numeric' }),
  })
}

// Newest-first entries -> [{ key, label, entries }] with one group per calendar day, newest day first.
// Entries inside a group keep their order (newest first).
export function groupActivityByDay(entries, today = todayString()) {
  const groups = []
  const byKey = new Map()
  entries.forEach((entry) => {
    const key = localDay(entry.timestamp)
    if (!byKey.has(key)) {
      const group = { key, label: dayLabel(key, today), entries: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    byKey.get(key).entries.push(entry)
  })
  return groups
}

// How each kind of item is named in the log (must match what AppContext writes as the title).
const LOG_TITLE = {
  bill: (b) => b.title,
  document: (d) => `${d.type} (${d.holder})`,
  subscription: (s) => s.name,
  task: (t) => t.title,
  appointment: (a) => a.title,
}

const COLLECTION = {
  bill: 'bills', document: 'documents', subscription: 'subscriptions', task: 'tasks', appointment: 'appointments',
}

// Where an activity row should link, or null when there is nothing to open.
//  - "deleted" entries have nothing left to open.
//  - Newer entries carry the item's id; the link works only while that item still exists.
//  - Older entries (saved before ids were recorded) are matched by title, and only when exactly one
//    item has that title, so a link never opens the wrong item.
export function activityLink(entry, data) {
  if (!entry || entry.action === 'deleted') return null
  const items = data?.[COLLECTION[entry.type]]
  if (!items) return null

  if (entry.itemId !== undefined && entry.itemId !== null) {
    return items.some((i) => i.id === entry.itemId) ? searchItemPath({ kind: entry.type, sourceId: entry.itemId }) : null
  }

  const matches = items.filter((i) => LOG_TITLE[entry.type](i) === entry.title)
  return matches.length === 1 ? searchItemPath({ kind: entry.type, sourceId: matches[0].id }) : null
}
