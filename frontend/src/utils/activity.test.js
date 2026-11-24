import { describe, expect, it } from 'vitest'
import { MAX_ACTIVITY, activityLink, dayLabel, groupActivityByDay, localDay } from './activity'

// Build a timestamp from local calendar parts so the tests do not depend on the machine's time zone.
const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString()
const TODAY = '2026-11-24'

describe('localDay and dayLabel', () => {
  it('reads the local calendar day of a timestamp', () => {
    expect(localDay(at(2026, 11, 24, 0, 5))).toBe('2026-11-24')
    expect(localDay(at(2026, 11, 24, 23, 55))).toBe('2026-11-24')
    expect(localDay('not a date')).toBe('')
  })

  it('labels today and yesterday, then longer dates', () => {
    expect(dayLabel('2026-11-24', TODAY)).toBe('Today')
    expect(dayLabel('2026-11-23', TODAY)).toBe('Yesterday')
    expect(dayLabel('2026-11-17', TODAY)).toContain('17 November')
    expect(dayLabel('2026-11-17', TODAY)).not.toContain('2026')
  })

  it('adds the year for another year and handles month boundaries', () => {
    expect(dayLabel('2025-12-31', TODAY)).toContain('2025')
    expect(dayLabel('2026-11-30', '2026-12-01')).toBe('Yesterday')
    expect(dayLabel('', TODAY)).toBe('Earlier')
  })
})

describe('groupActivityByDay', () => {
  const entries = [
    { id: 'a', timestamp: at(2026, 11, 24, 15) },
    { id: 'b', timestamp: at(2026, 11, 24, 9) },
    { id: 'c', timestamp: at(2026, 11, 23, 20) },
    { id: 'd', timestamp: at(2026, 11, 10, 8) },
  ]

  it('makes one group per day, keeping newest-first order', () => {
    const groups = groupActivityByDay(entries, TODAY)
    expect(groups.map((g) => g.label.split(',')[0])).toEqual(['Today', 'Yesterday', 'Tuesday'])
    expect(groups.map((g) => g.entries.map((e) => e.id))).toEqual([['a', 'b'], ['c'], ['d']])
  })

  it('returns no groups for no entries', () => {
    expect(groupActivityByDay([], TODAY)).toEqual([])
  })

  it('puts entries with a broken timestamp together under Earlier', () => {
    const groups = groupActivityByDay([{ id: 'x', timestamp: 'oops' }, { id: 'y', timestamp: 'bad' }], TODAY)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Earlier')
  })
})

describe('activityLink', () => {
  const data = {
    bills: [{ id: 'b1', title: 'Rent' }, { id: 'b2', title: 'Water' }, { id: 'b3', title: 'Water' }],
    documents: [{ id: 'd1', type: 'Passport', holder: 'Asha' }],
    subscriptions: [{ id: 's1', name: 'Netflix' }],
    tasks: [{ id: 't1', title: 'Buy milk' }],
    appointments: [{ id: 'a1', title: 'Dentist' }],
  }

  it('links by item id while the item still exists', () => {
    expect(activityLink({ type: 'bill', action: 'paid', title: 'Rent', itemId: 'b1' }, data)).toBe('/bills?focus=b1')
    expect(activityLink({ type: 'appointment', action: 'completed', title: 'Dentist', itemId: 'a1' }, data))
      .toBe('/tasks?focus=a1&tab=appointments')
  })

  it('does not link when the item is gone or the entry is a deletion', () => {
    expect(activityLink({ type: 'bill', action: 'paid', title: 'Rent', itemId: 'gone' }, data)).toBeNull()
    expect(activityLink({ type: 'bill', action: 'deleted', title: 'Rent', itemId: 'b1' }, data)).toBeNull()
  })

  it('matches older entries without an id by title, but only when exactly one item has it', () => {
    expect(activityLink({ type: 'bill', action: 'paid', title: 'Rent' }, data)).toBe('/bills?focus=b1')
    expect(activityLink({ type: 'bill', action: 'paid', title: 'Water' }, data)).toBeNull() // two bills
    expect(activityLink({ type: 'bill', action: 'paid', title: 'Unknown' }, data)).toBeNull()
    expect(activityLink({ type: 'document', action: 'added', title: 'Passport (Asha)' }, data)).toBe('/documents?focus=d1')
  })

  it('is safe for unknown types or missing data', () => {
    expect(activityLink({ type: 'mystery', action: 'added', title: 'x' }, data)).toBeNull()
    expect(activityLink(null, data)).toBeNull()
    expect(activityLink({ type: 'bill', action: 'added', title: 'Rent' }, undefined)).toBeNull()
  })
})

describe('MAX_ACTIVITY', () => {
  it('is the 200 entry limit the log keeps', () => {
    expect(MAX_ACTIVITY).toBe(200)
  })
})
