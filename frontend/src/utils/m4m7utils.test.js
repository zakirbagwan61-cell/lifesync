import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { maskNumber } from './privacy'
import { renewingSoonCount } from './subscriptions'
import { LEAD_DAYS, leadTimeSummary } from './reminders'
import { addDays } from './helpers'
import { ZONES, inZone, setNow } from '../test/timezone'

describe('maskNumber', () => {
  it.each([
    ['ABCDE1234F', '••••••234F'],
    ['P1234567', '••••4567'],
    ['XXXX XXXX 1234', '••••••1234'],
    ['DL-0420110012345', '••••••2345'],
    ['12345', '•2345'],
  ])('%s -> %s', (input, masked) => {
    expect(maskNumber(input)).toBe(masked)
  })

  it('fully hides very short values', () => {
    expect(maskNumber('AB12')).toBe('••••')
    expect(maskNumber('7')).toBe('•')
  })

  it('handles empty and missing values', () => {
    expect(maskNumber('')).toBe('')
    expect(maskNumber('   ')).toBe('')
    expect(maskNumber(null)).toBe('')
    expect(maskNumber(undefined)).toBe('')
  })

  it('never shows more than the last 4 characters', () => {
    const masked = maskNumber('SECRET-NUMBER-9876')
    expect(masked.endsWith('9876')).toBe(true)
    expect(masked).not.toContain('SECRET')
  })

  it('accepts numbers', () => {
    expect(maskNumber(123456789)).toBe('•••••6789')
  })
})

describe('renewingSoonCount', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    setNow(2026, 11, 23)
  })
  afterEach(() => vi.useRealTimers())

  const sub = (days) => ({ id: String(days), name: 'S', cost: 1, cycle: 'Monthly', nextRenewal: addDays('2026-11-23', days) })

  it('counts renewals from today through day 7', () => {
    expect(renewingSoonCount([sub(0), sub(1), sub(7)])).toBe(3)
  })

  it('does not count day 8 or later', () => {
    expect(renewingSoonCount([sub(8), sub(30)])).toBe(0)
  })

  it('does not count renewals whose date has already passed', () => {
    expect(renewingSoonCount([sub(-1), sub(-20), sub(3)])).toBe(1)
  })

  it('supports another window and an empty list', () => {
    expect(renewingSoonCount([sub(10), sub(30), sub(31)], 30)).toBe(2)
    expect(renewingSoonCount([])).toBe(0)
  })

  it.each(ZONES)('uses the local day in %s', (zone) => {
    inZone(zone, () => {
      setNow(2026, 11, 23, 23, 45)
      expect(renewingSoonCount([sub(-1), sub(0), sub(7), sub(8)])).toBe(2)
    })
  })
})

describe('leadTimeSummary', () => {
  it('describes the current lead times', () => {
    expect(LEAD_DAYS).toMatchObject({ bill: 30, document: 60 })
    expect(leadTimeSummary()).toBe('Upcoming shows items due within 30 days, and documents within 60 days.')
  })
})
