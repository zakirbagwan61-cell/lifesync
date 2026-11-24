import { describe, expect, it } from 'vitest'
import { msUntilNextMidnight } from './useToday'

describe('msUntilNextMidnight', () => {
  it('counts to one second past the next local midnight', () => {
    expect(msUntilNextMidnight(new Date(2026, 10, 23, 23, 59, 0))).toBe(61 * 1000)
    expect(msUntilNextMidnight(new Date(2026, 10, 23, 0, 0, 0))).toBe(24 * 3600 * 1000 + 1000)
  })

  it('crosses month and year ends', () => {
    expect(msUntilNextMidnight(new Date(2026, 11, 31, 23, 0, 0))).toBe(3600 * 1000 + 1000)
    expect(msUntilNextMidnight(new Date(2026, 1, 28, 12, 0, 0))).toBe(12 * 3600 * 1000 + 1000)
  })

  it('is always positive', () => {
    expect(msUntilNextMidnight(new Date(2026, 5, 15, 23, 59, 59, 999))).toBeGreaterThan(0)
  })
})
