// Quick Add lets the user switch between Bill, Task, Appointment, Subscription and Document.
// Switching used to throw away whatever was typed. These helpers keep what still makes sense.

// Fields that mean the same thing in different forms. Typing a name or a date for one type
// carries over to the others that have an equivalent field.
export const SHARED_FIELD_GROUPS = [
  ['title', 'name'], // bill / task / appointment title, subscription service name
  ['amount', 'cost'], // bill amount, subscription cost
  ['dueDate', 'deadline', 'date', 'nextRenewal'], // the one date each type asks for
]

const isFilled = (value) => value !== undefined && value !== null && String(value).trim() !== ''

// Values from the form being left, translated to the field names of the form being opened.
// Only filled values are carried, and only into fields the new form actually has.
//   carryOverValues({ title: 'Rent', amount: 500 }, subscriptionFields) -> { name: 'Rent', cost: 500 }
export function carryOverValues(fromValues, toFields) {
  const carried = {}
  const toNames = new Set(toFields.map((f) => f.name))
  SHARED_FIELD_GROUPS.forEach((group) => {
    const source = group.find((name) => isFilled(fromValues?.[name]))
    if (source === undefined) return
    group.forEach((name) => {
      if (toNames.has(name)) carried[name] = fromValues[source]
    })
  })
  return carried
}

// Starting values for a form: its defaults, then what the user already typed in this same form
// earlier (blank values never hide a default), then values carried over from the form they just
// left, which win because they are the most recent thing typed.
export function mergeStartValues(defaults, saved, carried) {
  const merged = { ...defaults }
  Object.entries(saved || {}).forEach(([name, value]) => {
    if (isFilled(value) || typeof value === 'boolean') merged[name] = value
  })
  Object.entries(carried || {}).forEach(([name, value]) => { merged[name] = value })
  return merged
}

// True when carrying values over changed something compared with the plain defaults,
// so the form can tell the user their entries were kept.
export const hasCarriedChanges = (carried, defaults) =>
  Object.entries(carried || {}).some(([name, value]) => String(value) !== String(defaults?.[name] ?? ''))

// Remember the shared entries (name, amount, date) across several switches, so Bill -> Task ->
// Subscription still brings the amount typed on the Bill form. `values` is the form being left:
// a filled value replaces what was remembered, and a field the user cleared is forgotten.
// The result is keyed by the first name in each group, which carryOverValues understands.
export function rememberShared(previous, values) {
  const next = { ...previous }
  SHARED_FIELD_GROUPS.forEach((group) => {
    const key = group[0]
    const filled = group.find((name) => isFilled(values?.[name]))
    if (filled !== undefined) next[key] = values[filled]
    else if (group.some((name) => name in (values || {}))) delete next[key]
  })
  return next
}
