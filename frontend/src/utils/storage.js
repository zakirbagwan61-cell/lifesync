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
