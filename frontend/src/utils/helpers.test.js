import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addDays, addMonths, daysUntil, formatCurrency, formatDate, generateId, isOverdue, parseDateOnly,
  toDateString, todayString,
} from './helpers'
import { ZONES, inZone, setNow } from '../test/timezone'

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }))
afterEach(() => vi.useRealTimers())

describe('parseDateOnly', () => {
  it('reads a plain date', () => {
    expect(parseDateOnly('2026-11-16')).toEqual({ y: 2026, m: 11, d: 16 })
    expect(parseDateOnly('2028-02-29')).toEqual({ y: 2028, m: 2, d: 29 }) // leap day
  })

  it.each([
    ['2026-02-30', 'a day that does not exist'],
    ['2027-02-29', 'a leap day in a non-leap year'],
    ['2026-13-01', 'month 13'],
    ['16/11/2026', 'another format'],
    ['2026-11-16T10:00:00Z', 'a timestamp'],
    ['', 'an empty string'],
    [null, 'null'],
    [undefined, 'undefined'],
  ])('rejects %s (%s)', (input) => {
    expect(parseDateOnly(input)).toBeNull()
  })
})

describe('formatDate', () => {
  it('keeps the existing "16 Nov 2026" format', () => {
    expect(formatDate('2026-11-16')).toBe('16 Nov 2026')
    expect(formatDate('2026-01-05')).toBe('5 Jan 2026')
  })

  it('shows a dash for an empty value', () => {
    expect(formatDate('')).toBe('-')
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  describe.each(ZONES)('in %s', (zone) => {
    it('shows the same calendar date in every time zone', () => {
      inZone(zone, () => {
        expect(formatDate('2026-11-16')).toBe('16 Nov 2026')
        expect(formatDate('2026-01-01')).toBe('1 Jan 2026') // start of year
        expect(formatDate('2026-12-31')).toBe('31 Dec 2026') // end of year
        expect(formatDate('2028-02-29')).toBe('29 Feb 2028')
      })
    })
  })
})

describe('todayString', () => {
  it('uses the local calendar day, not the UTC day', () => {
    // 11:30 pm local is already the next day in UTC for zones west of UTC, and 00:30 am is the previous day east of it
    inZone('America/Los_Angeles', () => {
      setNow(2026, 11, 23, 23, 30)
      expect(todayString()).toBe('2026-11-23')
    })
    inZone('Pacific/Auckland', () => {
      setNow(2026, 11, 23, 0, 30)
      expect(todayString()).toBe('2026-11-23')
    })
  })

  it('pads single-digit months and days', () => {
    setNow(2026, 3, 5)
    expect(todayString()).toBe('2026-03-05')
  })
})

describe('daysUntil', () => {
  describe.each(ZONES)('in %s', (zone) => {
    it.each([
      [23, 30], // late evening
      [0, 30], // just after midnight
    ])('counts whole calendar days at %i:%i', (hour, minute) => {
      inZone(zone, () => {
        setNow(2026, 11, 23, hour, minute)
        expect(daysUntil('2026-11-23')).toBe(0)
        expect(daysUntil('2026-11-24')).toBe(1)
        expect(daysUntil('2026-11-30')).toBe(7)
        expect(daysUntil('2026-11-21')).toBe(-2)
        expect(daysUntil('2026-12-01')).toBe(8) // across a month end
        expect(daysUntil('2027-01-01')).toBe(39) // across a year end
      })
    })
  })

  it('is not thrown off by daylight saving changes', () => {
    // US clocks go back on 1 Nov 2026 and forward on 14 Mar 2027
    inZone('America/New_York', () => {
      setNow(2026, 10, 30)
      expect(daysUntil('2026-11-03')).toBe(4)
      setNow(2027, 3, 12)
      expect(daysUntil('2027-03-16')).toBe(4)
    })
  })

  it('returns null for an empty value', () => {
    expect(daysUntil('')).toBeNull()
    expect(daysUntil(null)).toBeNull()
  })
})

describe('isOverdue', () => {
  it('is true only for dates before today', () => {
    setNow(2026, 11, 23)
    expect(isOverdue('2026-11-22')).toBe(true)
    expect(isOverdue('2026-11-23')).toBe(false)
    expect(isOverdue('2026-11-24')).toBe(false)
    expect(isOverdue('')).toBe(false)
  })
})

describe('addDays', () => {
  it('moves forward and backward across month and year ends', () => {
    expect(addDays('2026-11-16', 5)).toBe('2026-11-21')
    expect(addDays('2026-11-28', 5)).toBe('2026-12-03')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-01-02', -3)).toBe('2025-12-30')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01')
    expect(addDays('2026-11-16', 0)).toBe('2026-11-16')
  })

  it.each(ZONES)('gives the same result in %s, including over daylight saving days', (zone) => {
    inZone(zone, () => {
      expect(addDays('2026-11-01', 1)).toBe('2026-11-02')
      expect(addDays('2027-03-14', 1)).toBe('2027-03-15')
      expect(addDays('2026-11-16', 30)).toBe('2026-12-16')
    })
  })
})

describe('addMonths', () => {
  it('keeps the day inside shorter months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29') // leap year
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30')
    expect(addMonths('2026-05-15', 1)).toBe('2026-06-15')
  })

  it('crosses year ends in both directions', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
    expect(addMonths('2026-11-16', 12)).toBe('2027-11-16') // yearly cycle
  })

  it.each(ZONES)('gives the same result in %s', (zone) => {
    inZone(zone, () => {
      expect(addMonths('2026-10-31', 1)).toBe('2026-11-30')
    })
  })
})

describe('toDateString', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateString(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('formatCurrency', () => {
  it('formats rupees with Indian digit grouping and no decimals', () => {
    expect(formatCurrency(0)).toBe('₹0')
    expect(formatCurrency(1850)).toBe('₹1,850')
    expect(formatCurrency(150000)).toBe('₹1,50,000')
    expect(formatCurrency(999.6)).toBe('₹1,000')
  })

  it('treats bad values as zero', () => {
    expect(formatCurrency(undefined)).toBe('₹0')
    expect(formatCurrency('abc')).toBe('₹0')
    expect(formatCurrency('250')).toBe('₹250')
  })
})

describe('generateId', () => {
  it('creates distinct ids', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateId()))
    expect(ids.size).toBe(500)
  })
})
