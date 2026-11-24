// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { freezeToday } from '../test/render'
import { readStored, seedStorage, storageFixture } from '../test/fixtures'

// The data layer, tested through the real provider on fixed data (today = 24 Nov 2026).
const setup = (storage = storageFixture()) => {
  seedStorage(storage)
  return renderHook(() => useApp(), { wrapper: AppProvider })
}

// What another open tab does: it saves a new value and the browser tells this tab.
const otherTabSaves = (key, value) =>
  act(() => {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(value), storageArea: localStorage }))
  })

const logOf = (result) => result.current.activity.map((e) => `${e.action} ${e.title}`)

beforeEach(() => {
  freezeToday()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('double actions (a double click before the screen updates)', () => {
  it('paying a bill twice pays it once and logs it once', () => {
    const { result } = setup()
    act(() => {
      result.current.markBillPaid('b-power')
      result.current.markBillPaid('b-power')
    })
    expect(result.current.bills.find((b) => b.id === 'b-power')).toMatchObject({ status: 'paid', paidAt: '2026-11-24' })
    expect(logOf(result).filter((l) => l === 'paid Electricity bill')).toHaveLength(1)
  })

  it('paying a monthly bill twice creates next month\'s bill only once', () => {
    const { result } = setup()
    const before = result.current.bills.length
    act(() => {
      result.current.markBillPaid('b-rent')
      result.current.markBillPaid('b-rent')
    })
    expect(result.current.bills).toHaveLength(before + 1)
    expect(result.current.bills.filter((b) => b.title === 'House rent' && b.status === 'pending')).toHaveLength(1)
  })

  it('toggling a task twice puts it back, and the log says completed then reopened', () => {
    const { result } = setup()
    act(() => {
      result.current.toggleTask('t-groceries')
      result.current.toggleTask('t-groceries')
    })
    expect(result.current.tasks.find((t) => t.id === 't-groceries').completed).toBe(false)
    expect(logOf(result).slice(0, 2)).toEqual(['reopened Buy groceries', 'completed Buy groceries'])
  })

  it('toggling an appointment twice is logged correctly too', () => {
    const { result } = setup()
    act(() => {
      result.current.toggleAppointment('a-team')
      result.current.toggleAppointment('a-team')
    })
    expect(logOf(result).slice(0, 2)).toEqual(['reopened Team meeting', 'completed Team meeting'])
  })

  it('renaming and then editing straight away logs the new name, not the old one', () => {
    const { result } = setup()
    act(() => {
      result.current.updateBill('b-rent', { title: 'Flat rent' })
      result.current.updateBill('b-rent', { amount: 16000 }) // no title in this change: uses the current one
    })
    expect(result.current.bills.find((b) => b.id === 'b-rent')).toMatchObject({ title: 'Flat rent', amount: 16000 })
    expect(logOf(result).slice(0, 2)).toEqual(['updated Flat rent', 'updated Flat rent'])
  })

  it('deleting right after an edit logs the edited title', () => {
    const { result } = setup()
    act(() => {
      result.current.updateTask('t-fees', { title: 'Pay term fees' })
      result.current.deleteTask('t-fees')
    })
    expect(result.current.tasks.some((t) => t.id === 't-fees')).toBe(false)
    expect(logOf(result)[0]).toBe('deleted Pay term fees')
  })

  it('reopening a bill twice is harmless', () => {
    const { result } = setup()
    act(() => {
      result.current.reopenBill('b-water')
      result.current.reopenBill('b-water')
    })
    expect(result.current.bills.find((b) => b.id === 'b-water')).toMatchObject({ status: 'pending', paidAt: null })
  })

  it('renewing a subscription twice moves the date two cycles', () => {
    const { result } = setup()
    act(() => {
      result.current.renewSubscription('s-netflix')
      result.current.renewSubscription('s-netflix')
    })
    expect(result.current.subscriptions.find((s) => s.id === 's-netflix').nextRenewal).toBe('2027-01-26')
  })

  it('saves the final state', () => {
    const { result } = setup()
    act(() => {
      result.current.markBillPaid('b-power')
      result.current.toggleTask('t-groceries')
    })
    expect(readStored('lifesync_bills').find((b) => b.id === 'b-power').status).toBe('paid')
    expect(readStored('lifesync_tasks').find((t) => t.id === 't-groceries').completed).toBe(true)
  })
})

describe('two tabs open at once', () => {
  it('shows a bill added in the other tab without reloading', () => {
    const { result } = setup()
    const added = { id: 'b-new', title: 'Gym fees', category: 'Other', amount: 900, dueDate: '2026-12-01', status: 'pending', paidAt: null }
    otherTabSaves('lifesync_bills', [...readStored('lifesync_bills'), added])
    expect(result.current.bills.map((b) => b.id)).toContain('b-new')
  })

  it('keeps the other tab\'s bill when this tab makes its own change afterwards', () => {
    const { result } = setup()
    const added = { id: 'b-new', title: 'Gym fees', category: 'Other', amount: 900, dueDate: '2026-12-01', status: 'pending', paidAt: null }
    otherTabSaves('lifesync_bills', [...readStored('lifesync_bills'), added])

    act(() => result.current.markBillPaid('b-power')) // this tab still had the old list a moment ago
    const saved = readStored('lifesync_bills').map((b) => b.id)
    expect(saved).toContain('b-new') // not overwritten by this tab's older copy
    expect(readStored('lifesync_bills').find((b) => b.id === 'b-power').status).toBe('paid')
  })

  it('can act on an item that only the other tab knew about', () => {
    const { result } = setup()
    otherTabSaves('lifesync_tasks', [...readStored('lifesync_tasks'), { id: 't-new', title: 'Renew licence', priority: 'High', deadline: '2026-12-02', completed: false, completedAt: null }])
    act(() => result.current.toggleTask('t-new'))
    expect(readStored('lifesync_tasks').find((t) => t.id === 't-new').completed).toBe(true)
    expect(logOf(result)[0]).toBe('completed Renew licence')
  })

  it('follows a reset made in the other tab', () => {
    const { result } = setup()
    otherTabSaves('lifesync_bills', [])
    otherTabSaves('lifesync_activity', [])
    expect(result.current.bills).toEqual([])
    expect(result.current.activity).toEqual([])
  })

  it('ignores damaged data from the other tab and keeps what it has', () => {
    const { result } = setup()
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'lifesync_bills', newValue: '{broken', storageArea: localStorage }))
    })
    expect(result.current.bills).toHaveLength(4)
  })

  it('follows snoozes made in the other tab', () => {
    const { result } = setup()
    otherTabSaves('lifesync_snoozes', { 'bill-b-power': '2026-11-30' })
    expect(result.current.snoozes).toEqual({ 'bill-b-power': '2026-11-30' })
  })
})

describe('when saving fails', () => {
  it('the change still happens on screen', () => {
    const { result } = setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Object.assign(new Error('full'), { name: 'QuotaExceededError', code: 22 })
    })
    act(() => result.current.addTask({ title: 'Call the bank', priority: 'Low', deadline: '2026-12-05' }))
    expect(result.current.tasks.some((t) => t.title === 'Call the bank')).toBe(true)
  })
})
