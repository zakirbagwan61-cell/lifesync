import { useState, useEffect, useRef, useCallback } from 'react'
import { readStored, keepBackup, parseStored, reportSaveResult } from '../utils/storage'

// Works like useState, but the value is also saved in the browser's localStorage,
// so it survives page refreshes.
//   const [bills, setBills, getBills] = useLocalStorage('lifesync_bills', [], isRecordList)
// The optional third argument checks the saved data has the expected shape. If the saved text is
// unreadable or has the wrong shape, the initial value is used and the unreadable text is kept
// under "<key>_unreadable_backup" instead of being overwritten.
//
// Three things make saving safe:
//  - Other tabs: when another tab saves this key, this tab picks up the new value (the browser's
//    "storage" event), so two open tabs do not overwrite each other's changes with old data.
//  - Latest value: setValue works on the newest value even when called twice before React re-renders
//    (a double click), and getValue() returns that newest value for code that needs to look something up.
//  - Failed saves (storage full or blocked) are reported, so the app can tell the user.
export default function useLocalStorage(key, initialValue, isValid) {
  const [value, setValueState] = useState(() => {
    const stored = readStored(localStorage, key, initialValue, isValid)
    if (stored.invalid) {
      keepBackup(localStorage, key, stored.raw)
      console.warn(`LifeSync: saved "${key}" could not be read; a copy was kept as "${key}_unreadable_backup".`)
    }
    return stored.value
  })

  // Always the newest value, even between a change and the next render.
  const latest = useRef(value)

  const setValue = useCallback((update) => {
    const next = typeof update === 'function' ? update(latest.current) : update
    latest.current = next
    setValueState(next)
  }, [])

  const getValue = useCallback(() => latest.current, [])

  // Every time the value changes, write it back to localStorage (skipping a write that would change nothing).
  useEffect(() => {
    try {
      const text = JSON.stringify(value)
      if (localStorage.getItem(key) !== text) localStorage.setItem(key, text)
      reportSaveResult(key, null)
    } catch (error) {
      // storage full or unavailable: the app keeps working in memory and the user is told (see SaveWarning)
      reportSaveResult(key, error)
    }
  }, [key, value])

  // Another tab saved this key: take its value. Broken, missing or unrelated values are ignored.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== key || event.storageArea !== localStorage) return
      const result = parseStored(event.newValue, isValid)
      if (!result.ok) return
      latest.current = result.value
      setValueState(result.value)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // isValid is a stable function passed by the caller; the listener only needs to follow the key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue, getValue]
}
