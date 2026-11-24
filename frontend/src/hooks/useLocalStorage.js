import { useState, useEffect } from 'react'
import { readStored, keepBackup } from '../utils/storage'

// Works like useState, but the value is also saved in the browser's localStorage,
// so it survives page refreshes.
//   const [bills, setBills] = useLocalStorage('lifesync_bills', [], isRecordList)
// The optional third argument checks the saved data has the expected shape. If the saved text is
// unreadable or has the wrong shape, the initial value is used and the unreadable text is kept
// under "<key>_unreadable_backup" instead of being overwritten.
export default function useLocalStorage(key, initialValue, isValid) {
  const [value, setValue] = useState(() => {
    const stored = readStored(localStorage, key, initialValue, isValid)
    if (stored.invalid) {
      keepBackup(localStorage, key, stored.raw)
      console.warn(`LifeSync: saved "${key}" could not be read; a copy was kept as "${key}_unreadable_backup".`)
    }
    return stored.value
  })

  // Every time the value changes, write it back to localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable: ignore, the app still works in memory
    }
  }, [key, value])

  return [value, setValue]
}
