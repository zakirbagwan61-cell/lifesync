import { useState, useEffect } from 'react'

// Works like useState, but the value is also saved in the browser's localStorage,
// so it survives page refreshes.
//   const [bills, setBills] = useLocalStorage('lifesync_bills', [])
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue // corrupted or blocked storage: fall back safely
    }
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
