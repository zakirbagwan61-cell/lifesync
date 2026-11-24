// Safe reading of saved data from localStorage.

// Where an unreadable copy of a saved value is kept before the app falls back to sample data.
export const backupKey = (key) => `${key}_unreadable_backup`

// Shape checks for the saved values (used by AppContext through useLocalStorage).
export const isRecordList = (value) =>
  Array.isArray(value) &&
  value.every((item) => item && typeof item === 'object' && (typeof item.id === 'string' || typeof item.id === 'number'))
export const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value)
export const isText = (value) => typeof value === 'string'

// Read one saved value. Returns { value, invalid, raw }.
//  - nothing saved, or storage blocked: the initial value is used (invalid is false)
//  - saved but not valid JSON, or not the expected shape (isValid returns false): the initial value is
//    used, invalid is true, and `raw` holds the original text so it can be kept instead of being lost
export function readStored(storage, key, initialValue, isValid) {
  let raw
  try {
    raw = storage.getItem(key)
  } catch {
    return { value: initialValue, invalid: false }
  }
  if (raw === null) return { value: initialValue, invalid: false }

  try {
    const parsed = JSON.parse(raw)
    if (!isValid || isValid(parsed)) return { value: parsed, invalid: false }
  } catch {
    // not valid JSON: handled below
  }
  return { value: initialValue, invalid: true, raw }
}

// Keep an unreadable saved value under a backup key, so falling back to sample data never destroys it.
// An existing backup is never overwritten (the first unreadable copy is the one worth keeping).
export function keepBackup(storage, key, raw) {
  try {
    if (storage.getItem(backupKey(key)) === null) storage.setItem(backupKey(key), raw)
  } catch {
    // storage blocked or full: nothing more can be done
  }
}

// Read a value another tab just saved. Returns { ok: true, value } when the text is valid JSON of the
// expected shape, and { ok: false } otherwise, so a broken value from elsewhere is never adopted.
export function parseStored(raw, isValid) {
  if (raw === null || raw === undefined) return { ok: false }
  try {
    const value = JSON.parse(raw)
    if (!isValid || isValid(value)) return { ok: true, value }
  } catch {
    // not valid JSON
  }
  return { ok: false }
}

// ----- Save problems -----
// When the browser refuses a save (storage full, or blocked by privacy settings) the app keeps working
// in memory, but the changes would be lost on reload. This small store remembers which keys failed so
// a notice can be shown, and clears them again as soon as a save works.
const failures = new Map() // key -> 'full' | 'blocked'
const listeners = new Set()
let snapshot = { failed: [], reason: null, version: 0 }

const emit = () => listeners.forEach((listener) => listener())

// 'full' when the browser says the quota is exceeded, otherwise 'blocked' (private mode, disabled storage)
export const saveFailureReason = (error) =>
  error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014)
    ? 'full'
    : 'blocked'

export function reportSaveResult(key, error) {
  const had = failures.has(key)
  if (!error) {
    if (!had) return
    failures.delete(key)
  } else {
    const reason = saveFailureReason(error)
    if (had && failures.get(key) === reason) return
    failures.set(key, reason)
  }
  const reasons = [...failures.values()]
  snapshot = {
    failed: [...failures.keys()],
    reason: reasons.includes('full') ? 'full' : reasons.length ? 'blocked' : null,
    // goes up each time a new problem appears, so a dismissed notice can come back for a new one
    version: error && !had ? snapshot.version + 1 : snapshot.version,
  }
  emit()
}

export const saveStatus = {
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot: () => snapshot,
}

// For tests: forget every recorded problem.
export function resetSaveStatus() {
  failures.clear()
  snapshot = { failed: [], reason: null, version: 0 }
  emit()
}
