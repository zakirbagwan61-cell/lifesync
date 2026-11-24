import { describe, expect, it } from 'vitest'
import { backupKey, isPlainObject, isRecordList, isText, keepBackup, readStored } from './storage'

// A tiny stand-in for localStorage
function fakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v)
    },
  }
}
const blocked = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

describe('shape checks', () => {
  it('isRecordList accepts lists of objects with an id', () => {
    expect(isRecordList([])).toBe(true)
    expect(isRecordList([{ id: 'a' }, { id: 5, title: 'x' }])).toBe(true)
  })

  it.each([
    ['null', null],
    ['an object', { id: 'a' }],
    ['a string', 'text'],
    ['a list with null', [{ id: 'a' }, null]],
    ['a list of numbers', [1, 2]],
    ['an item without an id', [{ title: 'x' }]],
    ['an item with an object id', [{ id: {} }]],
  ])('isRecordList rejects %s', (_label, value) => {
    expect(isRecordList(value)).toBe(false)
  })

  it('isPlainObject and isText', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1 })).toBe(true)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject('x')).toBe(false)
    expect(isText('Asha')).toBe(true)
    expect(isText(5)).toBe(false)
  })
})

describe('readStored', () => {
  it('returns the saved value when it is valid', () => {
    const storage = fakeStorage({ k: JSON.stringify([{ id: 'a' }]) })
    expect(readStored(storage, 'k', [], isRecordList)).toEqual({ value: [{ id: 'a' }], invalid: false })
  })

  it('uses the initial value when nothing is saved', () => {
    expect(readStored(fakeStorage(), 'k', ['seed'], isRecordList)).toEqual({ value: ['seed'], invalid: false })
  })

  it('works without a shape check', () => {
    const storage = fakeStorage({ k: '{"a":1}' })
    expect(readStored(storage, 'k', {}).value).toEqual({ a: 1 })
  })

  it('treats text that is not JSON as unreadable and returns the original text', () => {
    const storage = fakeStorage({ k: '{broken' })
    expect(readStored(storage, 'k', ['seed'], isRecordList)).toEqual({ value: ['seed'], invalid: true, raw: '{broken' })
  })

  it('treats valid JSON of the wrong shape as unreadable', () => {
    const storage = fakeStorage({ k: 'null' })
    expect(readStored(storage, 'k', ['seed'], isRecordList)).toEqual({ value: ['seed'], invalid: true, raw: 'null' })
    const storage2 = fakeStorage({ k: '{"id":"a"}' })
    expect(readStored(storage2, 'k', [], isRecordList).invalid).toBe(true)
  })

  it('falls back quietly when storage is blocked', () => {
    expect(readStored(blocked, 'k', ['seed'], isRecordList)).toEqual({ value: ['seed'], invalid: false })
  })

  it('does not change what is stored', () => {
    const storage = fakeStorage({ k: '{broken' })
    readStored(storage, 'k', [], isRecordList)
    expect(storage.data).toEqual({ k: '{broken' })
  })
})

describe('keepBackup', () => {
  it('stores the unreadable text under the backup key', () => {
    const storage = fakeStorage()
    keepBackup(storage, 'lifesync_bills', '{broken')
    expect(storage.data[backupKey('lifesync_bills')]).toBe('{broken')
    expect(backupKey('lifesync_bills')).toBe('lifesync_bills_unreadable_backup')
  })

  it('never overwrites an existing backup', () => {
    const storage = fakeStorage({ k_unreadable_backup: 'first' })
    keepBackup(storage, 'k', 'second')
    expect(storage.data.k_unreadable_backup).toBe('first')
  })

  it('does not throw when storage is blocked', () => {
    expect(() => keepBackup(blocked, 'k', 'x')).not.toThrow()
  })
})
