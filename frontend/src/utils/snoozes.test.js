import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pruneSnoozes } from './snoozes'
import { setNow } from '../test/timezone'

beforeEach(() => {
  vi.useFakeTimers()
  setNow(2026, 11, 23)
})
afterEach(() => vi.useRealTimers())

const data = {
  bills: [{ id: 'b1' }],
  documents: [{ id: 'd1' }],
  subscriptions: [{ id: 's1' }],
  tasks: [{ id: 't1' }],
  appointments: [{ id: 'a1' }],
}

describe('pruneSnoozes', () => {
  it('keeps active snoozes for items that still exist, and returns the same object', () => {
    const snoozes = { 'bill-b1': '2026-11-25', 'task-t1': '2026-12-01', 'document-d1': '2026-11-24' }
    expect(pruneSnoozes(snoozes, data)).toBe(snoozes)
  })

  it('removes snoozes whose date has arrived or passed', () => {
    const result = pruneSnoozes(
      { 'bill-b1': '2026-11-23', 'task-t1': '2026-11-01', 'subscription-s1': '', 'appointment-a1': '2026-11-30' },
      data
    )
    expect(result).toEqual({ 'appointment-a1': '2026-11-30' })
  })

  it('removes snoozes for items that were deleted', () => {
    const result = pruneSnoozes({ 'bill-gone': '2026-12-01', 'subscription-s1': '2026-12-01' }, data)
    expect(result).toEqual({ 'subscription-s1': '2026-12-01' })
  })

  it('handles ids that contain dashes', () => {
    const dashed = { ...data, bills: [{ id: 'abc-123-x' }] }
    expect(pruneSnoozes({ 'bill-abc-123-x': '2026-12-01' }, dashed)).toEqual({ 'bill-abc-123-x': '2026-12-01' })
  })

  it('ignores malformed values safely', () => {
    expect(pruneSnoozes({ 'bill-b1': null, 'task-t1': 42 }, data)).toEqual({})
    expect(pruneSnoozes(undefined, data)).toBeUndefined()
    expect(pruneSnoozes({}, data)).toEqual({})
  })

  it('does not change the object it was given', () => {
    const snoozes = { 'bill-gone': '2026-12-01', 'bill-b1': '2026-12-01' }
    pruneSnoozes(snoozes, data)
    expect(snoozes).toEqual({ 'bill-gone': '2026-12-01', 'bill-b1': '2026-12-01' })
  })
})
