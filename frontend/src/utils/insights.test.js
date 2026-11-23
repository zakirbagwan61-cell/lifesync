import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  KIND_PATHS, buildRecommendations, financialInsight, productivityInsight, spendingInsight, upcomingWeek,
} from './insights'
import { addDays } from './helpers'
import { ZONES, inZone, setNow } from '../test/timezone'

const TODAY = '2026-11-23'
const none = { bills: [], documents: [], subscriptions: [], tasks: [], appointments: [] }

const paid = (amount, paidAt) => ({ id: `p${amount}${paidAt}`, title: 'Paid', category: 'Other', amount, dueDate: paidAt, status: 'paid', paidAt })
const unpaid = (id, amount, dueDate, title = `Bill ${id}`) => ({ id, title, category: 'Other', amount, dueDate, status: 'pending', paidAt: null })
const task = (id, deadline, extra = {}) => ({ id, title: `Task ${id}`, priority: 'Medium', deadline, completed: false, completedAt: null, ...extra })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  setNow(2026, 11, 23)
})
afterEach(() => vi.useRealTimers())

describe('spendingInsight', () => {
  it('has no data when nothing was paid in either month', () => {
    expect(spendingInsight([])).toMatchObject({ state: 'none', current: 0, previous: 0, percent: null })
  })

  it('does not count unpaid bills as spending', () => {
    expect(spendingInsight([unpaid('a', 900, '2026-11-25')]).state).toBe('none')
  })

  it('reports "first" (no percentage) when last month had no payments', () => {
    const r = spendingInsight([paid(700, '2026-11-02')])
    expect(r).toMatchObject({ state: 'first', current: 700, previous: 0, percent: null })
  })

  it('calculates an increase', () => {
    const r = spendingInsight([paid(1000, '2026-10-10'), paid(1500, '2026-11-01')])
    expect(r.state).toBe('up')
    expect(r.percent).toBeCloseTo(50)
    expect(r).toMatchObject({ current: 1500, previous: 1000, lastMonth: 'October', thisMonth: 'November' })
  })

  it('calculates a decrease', () => {
    const r = spendingInsight([paid(1000, '2026-10-10'), paid(250, '2026-11-01')])
    expect(r.state).toBe('down')
    expect(r.percent).toBeCloseTo(-75)
  })

  it('reports a decrease to nothing as -100%', () => {
    const r = spendingInsight([paid(1000, '2026-10-10')])
    expect(r.state).toBe('down')
    expect(r.percent).toBeCloseTo(-100)
  })

  it('calls changes under 1% "same"', () => {
    expect(spendingInsight([paid(1000, '2026-10-10'), paid(1000, '2026-11-01')]).state).toBe('same')
    expect(spendingInsight([paid(10000, '2026-10-10'), paid(10050, '2026-11-01')]).state).toBe('same') // +0.5%
    expect(spendingInsight([paid(10000, '2026-10-10'), paid(10200, '2026-11-01')]).state).toBe('up') // +2%
  })

  it('adds up several payments in a month and ignores older months', () => {
    const r = spendingInsight([paid(100, '2026-11-01'), paid(200, '2026-11-20'), paid(500, '2026-10-05'), paid(9999, '2026-09-30')])
    expect(r).toMatchObject({ current: 300, previous: 500 })
  })

  it('compares January with December of the previous year', () => {
    setNow(2027, 1, 15)
    const r = spendingInsight([paid(800, '2026-12-20'), paid(1200, '2027-01-03')])
    expect(r).toMatchObject({ state: 'up', current: 1200, previous: 800, lastMonth: 'December', thisMonth: 'January' })
  })

  it('does not confuse months when today is the 31st', () => {
    setNow(2026, 3, 31)
    expect(spendingInsight([paid(100, '2026-02-10')]).lastMonth).toBe('February')
  })

  it.each(ZONES)('uses the local month in %s on the last evening of a month', (zone) => {
    inZone(zone, () => {
      setNow(2026, 11, 30, 23, 30)
      const r = spendingInsight([paid(100, '2026-10-31'), paid(300, '2026-11-30')])
      expect(r).toMatchObject({ current: 300, previous: 100, thisMonth: 'November', lastMonth: 'October' })
    })
  })
})

describe('upcomingWeek', () => {
  const week = (data, snoozes = {}) => upcomingWeek({ ...none, ...data }, snoozes)

  it('includes items due today up to and including day 7, sorted by date', () => {
    const { items } = week({
      bills: [unpaid('b7', 10, addDays(TODAY, 7)), unpaid('b0', 10, TODAY), unpaid('b3', 10, addDays(TODAY, 3))],
    })
    expect(items.map((r) => r.sourceId)).toEqual(['b0', 'b3', 'b7'])
  })

  it('excludes day 8, overdue and completed items', () => {
    const { items, overdue } = week({
      bills: [unpaid('far', 10, addDays(TODAY, 8)), unpaid('late', 10, addDays(TODAY, -1)), { ...unpaid('done', 10, TODAY), status: 'paid' }],
      tasks: [task('t', TODAY, { completed: true })],
    })
    expect(items).toEqual([])
    expect(overdue.map((r) => r.sourceId)).toEqual(['late'])
  })

  it('combines bills, tasks, appointments, documents and subscriptions', () => {
    const { items } = week({
      bills: [unpaid('b', 10, addDays(TODAY, 1))],
      tasks: [task('t', addDays(TODAY, 2))],
      appointments: [{ id: 'a', title: 'Dentist', date: addDays(TODAY, 3), time: '10:00', location: '', completed: false }],
      documents: [{ id: 'd', type: 'PAN', holder: 'A', expiryDate: addDays(TODAY, 4) }],
      subscriptions: [{ id: 's', name: 'Netflix', cost: 649, cycle: 'Monthly', nextRenewal: addDays(TODAY, 5) }],
    })
    expect(items.map((r) => r.kind)).toEqual(['bill', 'task', 'appointment', 'document', 'subscription'])
    expect(items.map((r) => r.path)).toEqual(['/bills', '/tasks', '/tasks', '/documents', '/subscriptions'])
  })

  it('adds a readable "when" label', () => {
    const { items } = week({ bills: [unpaid('a', 1, TODAY), unpaid('b', 1, addDays(TODAY, 1)), unpaid('c', 1, addDays(TODAY, 4))] })
    expect(items.map((r) => r.when)).toEqual(['Today', 'Tomorrow', 'In 4 days'])
  })

  it('takes a task\'s priority from the task itself', () => {
    const { items } = week({
      tasks: [task('h', addDays(TODAY, 6), { priority: 'High' }), task('l', addDays(TODAY, 6), { priority: 'Low' })],
    })
    expect(items.map((r) => r.priority)).toEqual(['high', 'low'])
  })

  it('works out priority from how close the date is for everything else', () => {
    const { items } = week({
      bills: [unpaid('a', 1, TODAY), unpaid('b', 1, addDays(TODAY, 1)), unpaid('c', 1, addDays(TODAY, 2)), unpaid('d', 1, addDays(TODAY, 3)), unpaid('e', 1, addDays(TODAY, 4))],
    })
    expect(items.map((r) => r.priority)).toEqual(['high', 'high', 'medium', 'medium', 'low'])
  })

  it('hides snoozed reminders', () => {
    const { items } = week({ bills: [unpaid('s', 10, addDays(TODAY, 2))] }, { 'bill-s': addDays(TODAY, 3) })
    expect(items).toEqual([])
  })

  it('is empty for no data', () => {
    expect(week({})).toEqual({ items: [], overdue: [] })
  })

  it.each(ZONES)('uses the local day in %s', (zone) => {
    inZone(zone, () => {
      setNow(2026, 11, 23, 23, 45)
      const { items } = week({ bills: [unpaid('today', 1, TODAY), unpaid('edge', 1, addDays(TODAY, 7)), unpaid('out', 1, addDays(TODAY, 8))] })
      expect(items.map((r) => r.sourceId)).toEqual(['today', 'edge'])
    })
  })
})

describe('productivityInsight', () => {
  it('handles no tasks without dividing by zero', () => {
    expect(productivityInsight([])).toEqual({ total: 0, completed: 0, percent: 0, doneThisWeek: 0, dueNextWeek: 0, overdue: 0 })
  })

  it('calculates completed, total and the rounded percentage', () => {
    const r = productivityInsight([task('1', TODAY, { completed: true }), task('2', TODAY), task('3', TODAY)])
    expect(r).toMatchObject({ total: 3, completed: 1, percent: 33 })
    expect(productivityInsight([task('1', TODAY, { completed: true }), task('2', TODAY, { completed: true }), task('3', TODAY)]).percent).toBe(67)
    expect(productivityInsight([task('1', TODAY, { completed: true })]).percent).toBe(100)
  })

  it('counts tasks completed in the last 7 days (today and the 6 days before)', () => {
    const done = (id, completedAt) => task(id, TODAY, { completed: true, completedAt })
    const r = productivityInsight([
      done('today', TODAY), done('six', addDays(TODAY, -6)), done('seven', addDays(TODAY, -7)),
      done('old', '2026-01-01'), done('nodate', null),
    ])
    expect(r.doneThisWeek).toBe(2)
  })

  it('counts pending tasks due in the next 7 days and overdue ones separately', () => {
    const r = productivityInsight([
      task('today', TODAY), task('seven', addDays(TODAY, 7)), task('eight', addDays(TODAY, 8)),
      task('late', addDays(TODAY, -1)), task('done', TODAY, { completed: true, completedAt: TODAY }),
    ])
    expect(r).toMatchObject({ dueNextWeek: 2, overdue: 1 })
  })
})

describe('financialInsight', () => {
  it('reports that there are no bills', () => {
    expect(financialInsight([])).toMatchObject({ hasBills: false, outstanding: 0 })
  })

  it('splits amounts into paid, pending and overdue', () => {
    const r = financialInsight([
      paid(320, '2026-11-02'), paid(80, '2026-10-02'),
      unpaid('a', 1850, '2026-11-26'), unpaid('b', 999, TODAY), // today is still pending
      unpaid('c', 399, '2026-11-21'),
    ])
    expect(r.paid).toEqual({ amount: 400, count: 2 })
    expect(r.pending).toEqual({ amount: 2849, count: 2 })
    expect(r.overdue).toEqual({ amount: 399, count: 1 })
    expect(r.outstanding).toBe(3248)
    expect(r.hasBills).toBe(true)
  })

  it('ignores bad amounts instead of producing NaN', () => {
    expect(financialInsight([unpaid('x', 'abc', TODAY), unpaid('y', '100', TODAY)]).outstanding).toBe(100)
  })
})

describe('buildRecommendations', () => {
  const recs = (data, spending) => buildRecommendations({ ...none, ...data }, spending ?? spendingInsight(data.bills || []))
  const ids = (list) => list.map((r) => r.id)

  it('gives nothing when there is nothing to recommend', () => {
    expect(recs({})).toEqual([])
    expect(recs({ bills: [paid(100, '2026-11-02')], tasks: [task('t', addDays(TODAY, 20))] })).toEqual([])
  })

  it('flags overdue bills with their total', () => {
    const [r] = recs({ bills: [unpaid('a', 399, '2026-11-21'), unpaid('b', 100, '2026-11-01')] })
    expect(r).toMatchObject({ id: 'overdue-bills', tone: 'danger', title: '2 bills overdue', path: '/bills' })
    expect(r.text).toContain('₹499')
  })

  it('uses the singular for one overdue bill', () => {
    expect(recs({ bills: [unpaid('a', 399, '2026-11-21')] })[0].title).toBe('1 bill overdue')
  })

  it('mentions the nearest bill due within 3 days, and not later ones', () => {
    const [r] = recs({ bills: [unpaid('far', 5, addDays(TODAY, 4)), unpaid('b', 1850, addDays(TODAY, 3), 'Electricity'), unpaid('a', 200, addDays(TODAY, 2), 'Water')] })
    expect(r).toMatchObject({ id: 'bill-soon', title: 'Water is due in 2 days' })
    expect(recs({ bills: [unpaid('far', 5, addDays(TODAY, 4))] })).toEqual([])
  })

  it('flags an expired document', () => {
    const [r] = recs({ documents: [{ id: 'd', type: 'Insurance', holder: 'A', expiryDate: addDays(TODAY, -10) }] })
    expect(r).toMatchObject({ id: 'document', tone: 'danger', title: 'Insurance has expired', path: '/documents' })
  })

  it('flags a document expiring within 30 days but not later', () => {
    const doc = (days) => ({ id: 'd', type: 'Passport', holder: 'A', expiryDate: addDays(TODAY, days) })
    expect(recs({ documents: [doc(30)] })[0]).toMatchObject({ tone: 'warning', title: 'Passport expires in 30 days' })
    expect(recs({ documents: [doc(31)] })).toEqual([])
    expect(recs({ documents: [{ id: 'n', type: 'Aadhaar', holder: 'A', expiryDate: '' }] })).toEqual([])
  })

  it('flags overdue tasks only', () => {
    expect(recs({ tasks: [task('a', addDays(TODAY, -1)), task('b', addDays(TODAY, -3)), task('ok', TODAY)] })[0]).toMatchObject({ id: 'overdue-tasks', title: '2 tasks overdue' })
    expect(recs({ tasks: [task('done', addDays(TODAY, -1), { completed: true })] })).toEqual([])
  })

  it('mentions a subscription renewing within 7 days', () => {
    const sub = (days, autoRenew) => ({ id: 's', name: 'Netflix', cost: 649, cycle: 'Monthly', nextRenewal: addDays(TODAY, days), autoRenew })
    expect(recs({ subscriptions: [sub(5, true)] })[0]).toMatchObject({ id: 'renewal', title: 'Netflix renews in 5 days' })
    expect(recs({ subscriptions: [sub(5, true)] })[0].text).toContain('automatically')
    expect(recs({ subscriptions: [sub(5, false)] })[0].text).toContain('if you renew')
    expect(recs({ subscriptions: [sub(8, true)] })).toEqual([])
  })

  describe('spending increase', () => {
    it('is suggested for a rise of 20% or more over a real earlier month', () => {
      const bills = [paid(1000, '2026-10-10'), paid(1200, '2026-11-01')]
      expect(ids(recs({ bills }))).toEqual(['spending-up'])
    })

    it.each([
      ['a 19% rise', [paid(1000, '2026-10-10'), paid(1190, '2026-11-01')]],
      ['a decrease', [paid(1000, '2026-10-10'), paid(300, '2026-11-01')]],
      ['no earlier month to compare with', [paid(5000, '2026-11-01')]],
    ])('is not suggested for %s', (_label, bills) => {
      expect(ids(recs({ bills }))).not.toContain('spending-up')
    })
  })

  it('orders by urgency and returns at most 4', () => {
    const list = recs({
      bills: [unpaid('late', 399, '2026-11-21'), unpaid('soon', 100, addDays(TODAY, 1)), paid(100, '2026-10-10'), paid(500, '2026-11-01')],
      documents: [{ id: 'd', type: 'PAN', holder: 'A', expiryDate: addDays(TODAY, -2) }],
      tasks: [task('t', addDays(TODAY, -1))],
      subscriptions: [{ id: 's', name: 'Spotify', cost: 119, cycle: 'Monthly', nextRenewal: addDays(TODAY, 2), autoRenew: true }],
    })
    expect(ids(list)).toEqual(['overdue-bills', 'bill-soon', 'document', 'overdue-tasks'])
  })

  it('honours a custom limit', () => {
    const data = { ...none, bills: [unpaid('late', 1, '2026-11-21')], tasks: [task('t', addDays(TODAY, -1))] }
    expect(buildRecommendations(data, spendingInsight(data.bills), 1)).toHaveLength(1)
  })
})

describe('KIND_PATHS', () => {
  it('sends every kind of reminder to an existing page', () => {
    expect(KIND_PATHS).toEqual({
      bill: '/bills', document: '/documents', subscription: '/subscriptions', task: '/tasks', appointment: '/tasks',
    })
  })
})
