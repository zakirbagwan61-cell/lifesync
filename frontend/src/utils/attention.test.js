import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAttentionLists, onlyBills } from './attention'
import { ZONES, inZone, setNow } from '../test/timezone'

// Fixed "today": Monday 23 Nov 2026, noon.
beforeEach(() => {
  vi.useFakeTimers()
  setNow(2026, 11, 23)
})
afterEach(() => vi.useRealTimers())

const none = { bills: [], documents: [], subscriptions: [], tasks: [], appointments: [] }
const bill = (id, dueDate, extra = {}) => ({ id, title: `Bill ${id}`, category: 'Other', amount: 100, dueDate, status: 'pending', paidAt: null, ...extra })
const task = (id, deadline, extra = {}) => ({ id, title: `Task ${id}`, priority: 'High', deadline, completed: false, ...extra })
const appt = (id, date, time, extra = {}) => ({ id, title: `Appt ${id}`, date, time, location: 'Clinic', completed: false, ...extra })
const ids = (list) => list.map((r) => r.id)

describe('buildAttentionLists', () => {
  const data = {
    ...none,
    bills: [bill('late', '2026-11-20'), bill('today', '2026-11-23'), bill('soon', '2026-11-27'), bill('far', '2026-12-20')],
    tasks: [task('t-today', '2026-11-23'), task('t-late', '2026-11-22'), task('t-week', '2026-11-30')],
    appointments: [appt('later', '2026-11-23', '15:00'), appt('early', '2026-11-23', '09:30')],
    subscriptions: [{ id: 's1', name: 'Netflix', cost: 649, cycle: 'Monthly', nextRenewal: '2026-11-25' }],
    documents: [{ id: 'd1', type: 'Passport', holder: 'Asha', number: 'X', expiryDate: '2026-11-28' }, { id: 'd2', type: 'PAN', holder: 'Asha', number: 'Y', expiryDate: '' }],
  }
  let lists
  beforeEach(() => { lists = buildAttentionLists(data, {}) }) // after the fake clock is set

  it('Today holds only items due today, appointments first in time order', () => {
    expect(ids(lists.today)).toEqual(['appointment-early', 'appointment-later', 'bill-today', 'task-t-today'])
  })

  it('Today includes bills due today, with time and location on appointments', () => {
    expect(lists.today.some((r) => r.kind === 'bill')).toBe(true)
    expect(lists.today.find((r) => r.id === 'appointment-early').detail).toBe('9:30 am · Clinic')
  })

  it('Next 7 days spans every kind and stops at 7 days', () => {
    const week = lists.week
    expect(new Set(week.map((r) => r.kind))).toEqual(new Set(['bill', 'task', 'appointment', 'document', 'subscription']))
    expect(ids(week)).toContain('bill-soon')
    expect(ids(week)).toContain('task-t-week') // exactly 7 days away
    expect(ids(week)).not.toContain('bill-far')
  })

  it('Overdue holds only past items', () => {
    expect(ids(lists.overdue).sort()).toEqual(['bill-late', 'task-t-late'])
  })

  it('All is overdue then upcoming, with no duplicates', () => {
    expect(ids(lists.all).slice(0, 2).sort()).toEqual(['bill-late', 'task-t-late'])
    expect(new Set(ids(lists.all)).size).toBe(lists.all.length)
    expect(ids(lists.all)).toContain('bill-far') // within its 30-day lead time
  })

  it('leaves out documents without an expiry date', () => {
    expect(ids(lists.all)).not.toContain('document-d2')
  })

  it('leaves out completed and paid items', () => {
    const done = buildAttentionLists({
      ...none,
      bills: [bill('paid', '2026-11-23', { status: 'paid' })],
      tasks: [task('done', '2026-11-23', { completed: true })],
      appointments: [appt('over', '2026-11-23', '10:00', { completed: true })],
    }, {})
    expect(done.all).toEqual([])
  })

  it('hides snoozed reminders until the snooze ends', () => {
    const snoozed = buildAttentionLists(data, { 'bill-today': '2026-11-24', 'task-t-late': '2026-11-23' })
    expect(ids(snoozed.today)).not.toContain('bill-today')
    expect(ids(snoozed.overdue)).toContain('task-t-late') // snooze date reached, so it is back
  })

  it('returns empty lists for no data', () => {
    expect(buildAttentionLists(none, {})).toEqual({ today: [], week: [], overdue: [], all: [] })
  })

  it('moves items between lists when the day changes', () => {
    setNow(2026, 11, 24)
    const next = buildAttentionLists(data, {})
    expect(ids(next.overdue)).toContain('bill-today') // was due "today", now overdue
    expect(ids(next.today)).not.toContain('bill-today')
  })

  it.each(ZONES)('gives the same Today list in %s', (zone) => {
    inZone(zone, () => {
      setNow(2026, 11, 23, 23, 30)
      expect(ids(buildAttentionLists(data, {}).today)).toEqual(['appointment-early', 'appointment-later', 'bill-today', 'task-t-today'])
    })
  })
})

describe('onlyBills', () => {
  it('keeps just the bill reminders', () => {
    const list = [{ id: 'bill-1', kind: 'bill' }, { id: 'task-1', kind: 'task' }]
    expect(onlyBills(list)).toEqual([{ id: 'bill-1', kind: 'bill' }])
  })
})
