// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useLocalStorage from './useLocalStorage'
import { isRecordList, resetSaveStatus, saveStatus } from '../utils/storage'

const KEY = 'lifesync_things'

// What happens in another tab: the browser tells this tab the saved value changed.
function otherTabSaves(key, value, { raw } = {}) {
  const newValue = raw ?? JSON.stringify(value)
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }))
  })
}

beforeEach(() => {
  resetSaveStatus()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useLocalStorage: reading and saving', () => {
  it('starts from what is saved, or from the initial value when nothing is', () => {
    localStorage.setItem(KEY, JSON.stringify([{ id: 'a' }]))
    expect(renderHook(() => useLocalStorage(KEY, [], isRecordList)).result.current[0]).toEqual([{ id: 'a' }])
    expect(renderHook(() => useLocalStorage('lifesync_other', ['seed'])).result.current[0]).toEqual(['seed'])
  })

  it('saves every change, and does not rewrite a value that is already saved', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderHook(() => useLocalStorage(KEY, []))
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual([])

    act(() => result.current[1]([{ id: 'a' }]))
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual([{ id: 'a' }])
    const writes = setItem.mock.calls.length

    act(() => result.current[1]([{ id: 'a' }])) // same content, new array
    expect(setItem.mock.calls.length).toBe(writes)
  })

  it('keeps an unreadable saved value as a backup instead of overwriting it', () => {
    localStorage.setItem(KEY, '{broken')
    const { result } = renderHook(() => useLocalStorage(KEY, ['seed'], isRecordList))
    expect(result.current[0]).toEqual(['seed'])
    expect(localStorage.getItem(`${KEY}_unreadable_backup`)).toBe('{broken')
  })
})

describe('useLocalStorage: the newest value', () => {
  it('two updates in a row both apply (a double click) and getValue sees them at once', () => {
    const { result } = renderHook(() => useLocalStorage('lifesync_count', 0))
    act(() => {
      result.current[1]((n) => n + 1)
      result.current[1]((n) => n + 1)
      expect(result.current[2]()).toBe(2) // before any re-render
    })
    expect(result.current[0]).toBe(2)
    expect(JSON.parse(localStorage.getItem('lifesync_count'))).toBe(2)
  })

  it('an update that changes nothing keeps the same value', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, [{ id: 'a' }]))
    const before = result.current[0]
    act(() => result.current[1]((list) => list))
    expect(result.current[0]).toBe(before)
  })
})

describe('useLocalStorage: another tab', () => {
  it('picks up a value saved by another tab, so an old copy is not saved over it', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, [{ id: 'a' }], isRecordList))
    otherTabSaves(KEY, [{ id: 'a' }, { id: 'b' }])

    expect(result.current[0]).toEqual([{ id: 'a' }, { id: 'b' }])
    expect(result.current[2]()).toEqual([{ id: 'a' }, { id: 'b' }])

    act(() => result.current[1]((list) => [...list, { id: 'c' }])) // an edit made after syncing keeps b
    expect(JSON.parse(localStorage.getItem(KEY)).map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not write the adopted value straight back (no ping-pong between tabs)', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, [], isRecordList))
    localStorage.setItem(KEY, JSON.stringify([{ id: 'x' }])) // what the other tab left in storage
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    otherTabSaves(KEY, [{ id: 'x' }])
    expect(result.current[0]).toEqual([{ id: 'x' }])
    expect(setItem).not.toHaveBeenCalled()
  })

  it.each([
    ['a different key', { key: 'lifesync_other', raw: '[{"id":"z"}]' }],
    ['a removed value', { key: KEY, raw: null }],
    ['text that is not JSON', { key: KEY, raw: '{oops' }],
    ['the wrong shape', { key: KEY, raw: '{"id":"z"}' }],
  ])('ignores %s', (_, { key, raw }) => {
    const { result } = renderHook(() => useLocalStorage(KEY, [{ id: 'a' }], isRecordList))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: raw, storageArea: localStorage }))
    })
    expect(result.current[0]).toEqual([{ id: 'a' }])
  })

  it('ignores changes to session storage', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, [{ id: 'a' }], isRecordList))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: '[{"id":"z"}]', storageArea: sessionStorage }))
    })
    expect(result.current[0]).toEqual([{ id: 'a' }])
  })

  it('stops listening when the component goes away', () => {
    const { result, unmount } = renderHook(() => useLocalStorage(KEY, [{ id: 'a' }], isRecordList))
    unmount()
    otherTabSaves(KEY, [{ id: 'z' }])
    expect(result.current[0]).toEqual([{ id: 'a' }])
  })
})

describe('useLocalStorage: a save that fails', () => {
  const failWith = (name, code) => vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Object.assign(new Error(name), { name, code })
  })

  it('keeps working in memory and reports the problem when storage is full', () => {
    failWith('QuotaExceededError', 22)
    const { result } = renderHook(() => useLocalStorage(KEY, []))
    act(() => result.current[1]([{ id: 'a' }]))

    expect(result.current[0]).toEqual([{ id: 'a' }]) // the app still shows the change
    expect(saveStatus.getSnapshot()).toMatchObject({ failed: [KEY], reason: 'full' })
  })

  it('reports blocked storage differently', () => {
    failWith('SecurityError', 18)
    renderHook(() => useLocalStorage(KEY, []))
    expect(saveStatus.getSnapshot()).toMatchObject({ failed: [KEY], reason: 'blocked' })
  })

  it('clears the problem as soon as a save works again', () => {
    const spy = failWith('QuotaExceededError', 22)
    const { result } = renderHook(() => useLocalStorage(KEY, []))
    expect(saveStatus.getSnapshot().failed).toEqual([KEY])

    spy.mockRestore() // storage has room again
    act(() => result.current[1]([{ id: 'a' }]))
    expect(saveStatus.getSnapshot().failed).toEqual([])
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual([{ id: 'a' }])
  })
})
