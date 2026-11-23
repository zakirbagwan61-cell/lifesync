import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LEAD_DAYS, buildReminders, groupReminders } from './reminders'
import { addDays } from './helpers'
import { ZONES, inZone, setNow } from '../test/timezone'

const TODAY = '2026-11-23'
const empty = { bills: [], documents: [], subscriptions: [], tasks: [], appointments: [] }

const bill = (id, dueDate, extra = {}) => ({
  id, title: `Bill ${id}`, category: 'Other', amount: 500, dueDate, status: 'pending', paidAt: null, ...extra,
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  setNow(2026, 11, 23)
})
afterEach(() => vi.useRealTimers())

describe('buildReminders', () => {
  it('creates one reminder per item, with a kind, label, date and completed flag', () => {
    const list = buildReminders({
      bills: [bill('b1', '2026-11-25', { amount: 1850 })],
      documents: [{ id: 'd1', type: 'PAN', holder: 'Asha', expiryDate: '2027-01-01' }],
      subscriptions: [{ id: 's1', name: 'Netflix', cost: 649, cycle: 'Monthly', nextRenewal: '2026-11-28' }],
      tasks: [{ id: 't1', title: 'Pay fees', priority: 'High', deadline: '2026-11-24', completed: false }],
      appointments: [{ id: 'a1', title: 'Dentist', date: '2026-11-25', time: '10:30', location: 'Clinic', completed: false }],
    })

    expect(list.map((r) => r.id)).toEqual(['bill-b1', 'document-d1', 'subscription-s1', 'task-t1', 'appointment-a1'])
    expect(list.map((r) => r.kind)).toEqual(['bill', 'document', 'subscription', 'task', 'appointment'])
    expect(list.map((r) => r.date)).toEqual(['2026-11-25', '2027-01-01', '2026-11-28', '2026-11-24', '2026-11-25'])
    expect(list.find((r) => r.kind === 'bill')).toMatchObject({ label: 'Bill due', detail: '₹1,850', sourceId: 'b1' })
    expect(list.find((r) => r.kind === 'document').title).toBe('PAN (Asha)')
    expect(list.find((r) => r.kind === 'subscription').detail).toBe('₹649 / month')
    expect(list.find((r) => r.kind === 'task').detail).toBe('High priority')
    expect(list.find((r) => r.kind === 'appointment').detail).toBe('10:30 am · Clinic')
  })

  it('uses "/ year" for yearly subscriptions', () => {
    const [r] = buildReminders({
      ...empty,
      subscriptions: [{ id: 's', name: 'Prime', cost: 1499, cycle: 'Yearly', nextRenewal: '2027-01-01' }],
    })
    expect(r.detail).toBe('₹1,499 / year')
  })

  it('skips documents that never expire', () => {
    expect(buildReminders({ ...empty, documents: [{ id: 'd', type: 'Aadhaar', holder: 'A', expiryDate: '' }] })).toEqual([])
  })

  it('marks paid bills, completed tasks and completed appointments as completed', () => {
    const list = buildReminders({
      ...empty,
      bills: [bill('b', TODAY, { status: 'paid' })],
      tasks: [{ id: 't', title: 'x', priority: 'Low', deadline: TODAY, completed: true }],
      appointments: [{ id: 'a', title: 'y', date: TODAY, time: '09:00', location: '', completed: true }],
    })
    expect(list.every((r) => r.completed)).toBe(true)
  })

  it('returns an empty list for empty data', () => {
    expect(buildReminders(empty)).toEqual([])
  })
})

describe('groupReminders', () => {
  const reminders = (...bills) => buildReminders({ ...empty, bills })

  it('sorts items into overdue, upcoming and completed', () => {
    const groups = groupReminders(
      reminders(
        bill('late', '2026-11-20'),
        bill('soon', '2026-11-26'),
        bill('paid', '2026-11-18', { status: 'paid' }),
      )
    )
    expect(groups.overdue.map((r) => r.sourceId)).toEqual(['late'])
    expect(groups.upcoming.map((r) => r.sourceId)).toEqual(['soon'])
    expect(groups.completed.map((r) => r.sourceId)).toEqual(['paid'])
    expect(groups.snoozed).toEqual([])
  })

  it('treats today as upcoming, not overdue', () => {
    const groups = groupReminders(reminders(bill('today', TODAY)))
    expect(groups.overdue).toEqual([])
    expect(groups.upcoming).toHaveLength(1)
  })

  it('respects each kind\'s lead time', () => {
    const inside = addDays(TODAY, LEAD_DAYS.bill)
    const outside = addDays(TODAY, LEAD_DAYS.bill + 1)
    const groups = groupReminders(reminders(bill('in', inside), bill('out', outside)))
    expect(groups.upcoming.map((r) => r.sourceId)).toEqual(['in'])

    // documents are shown earlier (60 days) than bills (30 days)
    const docs = groupReminders(
      buildReminders({
        ...empty,
        documents: [
          { id: 'd60', type: 'PAN', holder: 'A', expiryDate: addDays(TODAY, 60) },
          { id: 'd61', type: 'PAN', holder: 'A', expiryDate: addDays(TODAY, 61) },
        ],
      })
    )
    expect(docs.upcoming.map((r) => r.sourceId)).toEqual(['d60'])
  })

  it('sorts overdue and upcoming by date, and completed most recent first', () => {
    const groups = groupReminders(
      reminders(
        bill('c', '2026-11-29'), bill('a', '2026-11-24'), bill('b', '2026-11-26'),
        bill('o2', '2026-11-21'), bill('o1', '2026-11-10'),
        bill('p1', '2026-10-01', { status: 'paid' }), bill('p2', '2026-11-01', { status: 'paid' }),
      )
    )
    expect(groups.upcoming.map((r) => r.sourceId)).toEqual(['a', 'b', 'c'])
    expect(groups.overdue.map((r) => r.sourceId)).toEqual(['o1', 'o2'])
    expect(groups.completed.map((r) => r.sourceId)).toEqual(['p2', 'p1'])
  })

  describe('snoozing', () => {
    it('hides a reminder until its snooze date', () => {
      const groups = groupReminders(reminders(bill('x', '2026-11-25')), { 'bill-x': '2026-11-26' })
      expect(groups.upcoming).toEqual([])
      expect(groups.snoozed).toHaveLength(1)
      expect(groups.snoozed[0].snoozedUntil).toBe('2026-11-26')
    })

    it('brings it back on the snooze date itself', () => {
      const groups = groupReminders(reminders(bill('x', '2026-11-25')), { 'bill-x': TODAY })
      expect(groups.snoozed).toEqual([])
      expect(groups.upcoming).toHaveLength(1)
    })

    it('ignores snoozes that have passed', () => {
      const groups = groupReminders(reminders(bill('x', '2026-11-25')), { 'bill-x': '2026-11-20' })
      expect(groups.upcoming).toHaveLength(1)
    })

    it('can snooze an overdue reminder', () => {
      const groups = groupReminders(reminders(bill('x', '2026-11-10')), { 'bill-x': '2026-11-30' })
      expect(groups.overdue).toEqual([])
      expect(groups.snoozed).toHaveLength(1)
    })

    it('never snoozes a completed reminder', () => {
      const groups = groupReminders(reminders(bill('x', TODAY, { status: 'paid' })), { 'bill-x': '2026-12-31' })
      expect(groups.completed).toHaveLength(1)
      expect(groups.snoozed).toEqual([])
    })
  })

  it.each(ZONES)('groups the same way in %s', (zone) => {
    inZone(zone, () => {
      setNow(2026, 11, 23, 23, 30)
      const groups = groupReminders(reminders(bill('late', '2026-11-22'), bill('today', TODAY), bill('next', '2026-11-24')))
      expect(groups.overdue.map((r) => r.sourceId)).toEqual(['late'])
      expect(groups.upcoming.map((r) => r.sourceId)).toEqual(['today', 'next'])
    })
  })

  it('handles empty input', () => {
    expect(groupReminders([])).toEqual({ overdue: [], upcoming: [], snoozed: [], completed: [] })
  })
})
