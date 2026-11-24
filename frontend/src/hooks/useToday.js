import { useEffect, useState } from 'react'
import { todayString } from '../utils/helpers'

// Milliseconds from `now` until just after the next local midnight (1 second past, so the new day is certain).
export function msUntilNextMidnight(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1) - now
}

// Today's date as "YYYY-MM-DD" that updates itself when the day changes, so a tab left open
// overnight does not keep showing yesterday's "Today". It re-checks at the next midnight and
// whenever the tab becomes visible again (timers can pause while a laptop sleeps).
export default function useToday() {
  const [today, setToday] = useState(todayString)

  useEffect(() => {
    let timer
    const refresh = () => setToday(todayString())

    const schedule = () => {
      timer = window.setTimeout(() => { refresh(); schedule() }, msUntilNextMidnight())
    }
    schedule()

    const onVisible = () => { if (!document.hidden) refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return today
}
