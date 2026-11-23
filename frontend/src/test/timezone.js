import { vi } from 'vitest'

// Helpers for date tests. Node lets a test change the time zone while it runs (process.env.TZ),
// so the same code can be checked as if it ran in India, New York, Honolulu and so on.

// Zones on both sides of UTC, including the extremes (UTC-10 and UTC+14) and one with daylight saving.
export const ZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Pacific/Honolulu',
  'Pacific/Auckland',
  'Pacific/Kiritimati',
]

// Run `fn` with the process time zone set to `zone`, then put the old zone back.
export function inZone(zone, fn) {
  const previous = process.env.TZ
  process.env.TZ = zone
  try {
    return fn()
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
}

// Fake "now" as a local wall-clock time (month is 1 to 12). Needs vi.useFakeTimers() in the test.
export function setNow(year, month, day, hour = 12, minute = 0) {
  vi.setSystemTime(new Date(year, month - 1, day, hour, minute))
}
