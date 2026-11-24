import { useEffect, useState } from 'react'

// Returns `value` after it has stopped changing for `delay` ms, so something expensive
// (like searching every module) does not run on every keystroke.
export default function useDebouncedValue(value, delay = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
