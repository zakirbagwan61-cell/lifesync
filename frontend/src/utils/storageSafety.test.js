import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isRecordList, parseStored, reportSaveResult, resetSaveStatus, saveFailureReason, saveStatus } from './storage'

const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError', code: 22 })
const denied = () => Object.assign(new Error('denied'), { name: 'SecurityError', code: 18 })

describe('parseStored (a value saved by another tab)', () => {
  it('accepts valid JSON of the expected shape', () => {
    expect(parseStored('[{"id":"a"}]', isRecordList)).toEqual({ ok: true, value: [{ id: 'a' }] })
    expect(parseStored('{"x":1}')).toEqual({ ok: true, value: { x: 1 } })
  })

  it.each([
    ['nothing saved', null],
    ['undefined', undefined],
    ['text that is not JSON', '{oops'],
    ['the wrong shape', '{"id":"a"}'],
    ['records without ids', '[{"title":"x"}]'],
  ])('rejects %s, so a broken value is never adopted', (_, raw) => {
    expect(parseStored(raw, isRecordList).ok).toBe(false)
  })
})

describe('saveFailureReason', () => {
  it('tells a full browser storage from storage that is blocked', () => {
    expect(saveFailureReason(quota())).toBe('full')
    expect(saveFailureReason({ name: 'NS_ERROR_DOM_QUOTA_REACHED' })).toBe('full')
    expect(saveFailureReason({ code: 1014 })).toBe('full')
    expect(saveFailureReason(denied())).toBe('blocked')
    expect(saveFailureReason(new Error('anything else'))).toBe('blocked')
    expect(saveFailureReason(undefined)).toBe('blocked')
  })
})

describe('save status store', () => {
  beforeEach(() => resetSaveStatus())

  it('starts with no problems', () => {
    expect(saveStatus.getSnapshot()).toEqual({ failed: [], reason: null, version: 0 })
  })

  it('records a failed key with its reason and bumps the version', () => {
    reportSaveResult('lifesync_bills', quota())
    expect(saveStatus.getSnapshot()).toEqual({ failed: ['lifesync_bills'], reason: 'full', version: 1 })
  })

  it('clears a key when a later save works, and reports nothing for keys that never failed', () => {
    const before = saveStatus.getSnapshot()
    reportSaveResult('lifesync_tasks', null)
    expect(saveStatus.getSnapshot()).toBe(before) // same object: nothing changed, nothing re-rendered

    reportSaveResult('lifesync_bills', quota())
    reportSaveResult('lifesync_bills', null)
    expect(saveStatus.getSnapshot()).toMatchObject({ failed: [], reason: null })
  })

  it('does not bump the version for a repeat of the same failure, but does for a new one', () => {
    reportSaveResult('lifesync_bills', quota())
    const first = saveStatus.getSnapshot()
    reportSaveResult('lifesync_bills', quota())
    expect(saveStatus.getSnapshot()).toBe(first)

    reportSaveResult('lifesync_tasks', quota())
    expect(saveStatus.getSnapshot().version).toBe(2)
    expect(saveStatus.getSnapshot().failed).toEqual(['lifesync_bills', 'lifesync_tasks'])
  })

  it('a key that fails again after recovering counts as a new problem', () => {
    reportSaveResult('lifesync_bills', quota())
    reportSaveResult('lifesync_bills', null)
    reportSaveResult('lifesync_bills', quota())
    expect(saveStatus.getSnapshot().version).toBe(2)
  })

  it('"full" wins over "blocked" when both are present', () => {
    reportSaveResult('a', denied())
    expect(saveStatus.getSnapshot().reason).toBe('blocked')
    reportSaveResult('b', quota())
    expect(saveStatus.getSnapshot().reason).toBe('full')
  })

  it('tells subscribers about every change, and stops after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = saveStatus.subscribe(listener)
    reportSaveResult('a', quota())
    reportSaveResult('a', null)
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    reportSaveResult('a', quota())
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
