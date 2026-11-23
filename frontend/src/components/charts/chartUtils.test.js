import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatAxisMoney, monthWindow, niceScale, paymentStatus, spendingByCategory, spendingByMonth, tasksByMonth,
} from './chartUtils'
import { ZONES, inZone, setNow } from '../../test/timezone'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  setNow(2026, 11, 23)
})
afterEach(() => vi.useRealTimers())

const paid = (amount, paidAt, category = 'Other') => ({
  id: Math.random(), title: 'x', category, amount, dueDate: paidAt, status: 'paid', paidAt,
})
const unpaid = (amount, dueDate, category = 'Other') => ({
  id: Math.random(), title: 'x', category, amount, dueDate, status: 'pending', paidAt: null,
})

describe('monthWindow', () => {
  it('lists months ending with the current one', () => {
    const months = monthWindow(5)
    expect(months.map((m) => m.key)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'])
    expect(months.map((m) => m.label)).toEqual(['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'])
    expect(months[5].full).toBe('November 2026')
  })

  it('can look ahead as well', () => {
    expect(monthWindow(3, 2).map((m) => m.key)).toEqual(['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01'])
  })

  it('crosses a year boundary going back', () => {
    setNow(2027, 2, 10)
    expect(monthWindow(5).map((m) => m.key)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02'])
  })

  it('does not skip February when today is the 31st', () => {
    setNow(2026, 3, 31)
    expect(monthWindow(2).map((m) => m.key)).toEqual(['2026-01', '2026-02', '2026-03'])
    setNow(2026, 1, 31)
    expect(monthWindow(0, 1).map((m) => m.key)).toEqual(['2026-01', '2026-02'])
  })

  it.each(ZONES)('is the same in %s late on the last day of a month', (zone) => {
    inZone(zone, () => {
      setNow(2026, 11, 30, 23, 45)
      expect(monthWindow(1).map((m) => m.key)).toEqual(['2026-10', '2026-11'])
    })
  })
})

describe('spendingByMonth', () => {
  const months = monthWindow(2) // Sep, Oct, Nov

  it('adds up paid bills by the month they were paid', () => {
    const { data, hidden } = spendingByMonth(
      [paid(100, '2026-09-05'), paid(250, '2026-11-01'), paid(50, '2026-11-20'), paid(900, '2026-10-31')],
      months
    )
    expect(data.map((d) => d.value)).toEqual([100, 900, 300])
    expect(data[2]).toMatchObject({ label: 'Nov', full: 'November 2026' })
    expect(hidden).toBe(0)
  })

  it('ignores unpaid bills and counts payments outside the window', () => {
    const { data, hidden } = spendingByMonth(
      [unpaid(500, '2026-11-10'), paid(70, '2026-01-10'), paid(30, '2026-11-02'), { ...paid(10, null), paidAt: null }],
      months
    )
    expect(data.map((d) => d.value)).toEqual([0, 0, 30])
    expect(hidden).toBe(1)
  })

  it('returns zeros for no bills', () => {
    expect(spendingByMonth([], months).data.map((d) => d.value)).toEqual([0, 0, 0])
  })

  it('treats a bad amount as zero', () => {
    expect(spendingByMonth([paid('abc', '2026-11-02'), paid('40', '2026-11-03')], months).data[2].value).toBe(40)
  })
})

describe('spendingByCategory', () => {
  const bills = [
    paid(15000, '2026-11-02', 'Rent'),
    paid(320, '2026-11-03', 'Other'),
    unpaid(1850, '2026-11-26', 'Electricity'),
    unpaid(400, '2026-11-27', 'Electricity'),
    { ...paid(100, '2026-11-04'), category: '' },
  ]

  it('paid mode counts paid bills only, largest first', () => {
    expect(spendingByCategory(bills, 'paid')).toEqual([
      { label: 'Rent', value: 15000 },
      { label: 'Other', value: 420 }, // the bill with no category falls into "Other"
    ])
  })

  it('all mode includes unpaid bills', () => {
    expect(spendingByCategory(bills, 'all').map((c) => [c.label, c.value])).toEqual([
      ['Rent', 15000], ['Electricity', 2250], ['Other', 420],
    ])
  })

  it('drops zero-value categories and handles no bills', () => {
    expect(spendingByCategory([paid(0, '2026-11-02', 'Rent')], 'paid')).toEqual([])
    expect(spendingByCategory([], 'all')).toEqual([])
  })
})

describe('paymentStatus', () => {
  it('splits bills into paid, pending and overdue', () => {
    expect(
      paymentStatus([
        paid(1, '2026-11-01'),
        unpaid(1, '2026-11-22'), // yesterday: overdue
        unpaid(1, '2026-11-23'), // today: still pending
        unpaid(1, '2026-12-25'),
      ])
    ).toEqual({ paid: 1, pending: 2, overdue: 1 })
  })

  it('is all zeros for no bills', () => {
    expect(paymentStatus([])).toEqual({ paid: 0, pending: 0, overdue: 0 })
  })

  it.each(ZONES)('judges overdue by the local calendar day in %s', (zone) => {
    inZone(zone, () => {
      setNow(2026, 11, 23, 23, 30)
      expect(paymentStatus([unpaid(1, '2026-11-22'), unpaid(1, '2026-11-23')])).toEqual({ paid: 0, pending: 1, overdue: 1 })
    })
  })
})

describe('tasksByMonth', () => {
  const months = monthWindow(1, 1) // Oct, Nov, Dec
  const task = (completed, completedAt, deadline) => ({ id: Math.random(), title: 't', priority: 'Low', completed, completedAt, deadline })

  it('counts completed tasks by completion month and pending tasks by deadline month', () => {
    const { data, hidden } = tasksByMonth(
      [
        task(true, '2026-10-30', '2026-10-01'), // completed in Oct (the deadline is ignored)
        task(true, '2026-11-17', '2026-11-10'),
        task(false, null, '2026-11-24'),
        task(false, null, '2026-12-05'),
        task(false, null, '2026-12-31'),
      ],
      months
    )
    expect(data.map((d) => [d.label, d.completed, d.pending])).toEqual([
      ['Oct', 1, 0], ['Nov', 1, 1], ['Dec', 0, 2],
    ])
    expect(hidden).toBe(0)
  })

  it('counts tasks outside the window as hidden', () => {
    const { data, hidden } = tasksByMonth(
      [task(false, null, '2025-01-01'), task(false, null, '2027-06-01'), task(true, null, '2026-11-01')],
      months
    )
    expect(data.every((d) => d.completed === 0 && d.pending === 0)).toBe(true)
    expect(hidden).toBe(3) // a completed task with no completion date cannot be placed either
  })

  it('handles no tasks', () => {
    expect(tasksByMonth([], months).hidden).toBe(0)
  })
})

describe('niceScale', () => {
  it('rounds the top up to a tidy number', () => {
    expect(niceScale(3750)).toEqual({ top: 4000, values: [0, 1000, 2000, 3000, 4000] })
    expect(niceScale(15000)).toEqual({ top: 15000, values: [0, 5000, 10000, 15000] })
    expect(niceScale(320)).toEqual({ top: 400, values: [0, 100, 200, 300, 400] })
  })

  it('always reaches at least the maximum', () => {
    for (const max of [1, 7, 99, 320, 1850, 15320, 99999, 250000]) {
      expect(niceScale(max).top).toBeGreaterThanOrEqual(max)
    }
  })

  it('gives a sensible scale for no data', () => {
    expect(niceScale(0).top).toBe(1000)
    expect(niceScale(-5).values[0]).toBe(0)
  })

  it('uses whole numbers for counts', () => {
    expect(niceScale(3, { integer: true })).toEqual({ top: 3, values: [0, 1, 2, 3] })
    expect(niceScale(10, { integer: true })).toEqual({ top: 10, values: [0, 5, 10] })
    expect(niceScale(0, { integer: true }).top).toBe(4)
    expect(niceScale(7, { integer: true }).values.every(Number.isInteger)).toBe(true)
  })
})

describe('formatAxisMoney', () => {
  it.each([
    [0, '₹0'],
    [500, '₹500'],
    [1000, '₹1k'],
    [1500, '₹1.5k'],
    [20000, '₹20k'],
    [100000, '₹1L'],
    [150000, '₹1.5L'],
  ])('%i -> %s', (value, label) => {
    expect(formatAxisMoney(value)).toBe(label)
  })
})
