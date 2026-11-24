import { describe, expect, it } from 'vitest'
import { reopenBillInList } from './bills'

const bill = (id, extra = {}) => ({
  id, title: 'Rent', category: 'Rent', amount: 15000, dueDate: '2026-11-05', recurring: false,
  status: 'pending', paidAt: null, ...extra,
})
const paid = (id, extra = {}) => bill(id, { status: 'paid', paidAt: '2026-11-04', ...extra })

describe('reopenBillInList', () => {
  it('turns a paid bill back into a pending one and clears its payment date', () => {
    const [reopened] = reopenBillInList([paid('a')], 'a')
    expect(reopened).toMatchObject({ id: 'a', status: 'pending', paidAt: null, title: 'Rent', amount: 15000 })
  })

  it('does not change the list when the bill is already pending or does not exist', () => {
    const list = [bill('a')]
    expect(reopenBillInList(list, 'a')).toBe(list)
    expect(reopenBillInList(list, 'missing')).toBe(list)
  })

  it('leaves other bills alone', () => {
    const list = [paid('a'), bill('b', { title: 'Water' }), paid('c', { title: 'Gas' })]
    const next = reopenBillInList(list, 'a')
    expect(next[1]).toBe(list[1])
    expect(next[2]).toBe(list[2])
  })

  describe('recurring bills', () => {
    it('removes the next-month copy that was created automatically', () => {
      const list = [paid('a', { recurring: true }), bill('copy', { recurring: true, dueDate: '2026-12-05' })]
      const next = reopenBillInList(list, 'a')
      expect(next.map((b) => b.id)).toEqual(['a'])
      expect(next[0].status).toBe('pending')
    })

    it('uses month-end rules when finding the copy (31 Jan -> 28 Feb)', () => {
      const list = [
        paid('a', { recurring: true, dueDate: '2027-01-31' }),
        bill('copy', { recurring: true, dueDate: '2027-02-28' }),
      ]
      expect(reopenBillInList(list, 'a').map((b) => b.id)).toEqual(['a'])
    })

    it('keeps a copy the user has edited', () => {
      const list = [paid('a', { recurring: true }), bill('copy', { recurring: true, dueDate: '2026-12-05', amount: 16000 })]
      expect(reopenBillInList(list, 'a').map((b) => b.id)).toEqual(['a', 'copy'])
    })

    it('keeps a copy that has already been paid', () => {
      const list = [paid('a', { recurring: true }), paid('copy', { recurring: true, dueDate: '2026-12-05' })]
      expect(reopenBillInList(list, 'a').map((b) => b.id)).toEqual(['a', 'copy'])
    })

    it('keeps similar bills that are due on a different date', () => {
      const list = [paid('a', { recurring: true }), bill('other', { recurring: true, dueDate: '2027-01-05' })]
      expect(reopenBillInList(list, 'a').map((b) => b.id)).toEqual(['a', 'other'])
    })

    it('removes only one copy when two identical ones exist', () => {
      const copy = (id) => bill(id, { recurring: true, dueDate: '2026-12-05' })
      const list = [paid('a', { recurring: true }), copy('c1'), copy('c2')]
      expect(reopenBillInList(list, 'a').map((b) => b.id)).toEqual(['a', 'c2'])
    })
  })

  it('does not touch other bills when the reopened bill is not recurring', () => {
    const list = [paid('a'), bill('same-looking', { dueDate: '2026-12-05', recurring: true })]
    expect(reopenBillInList(list, 'a').map((b) => b.id)).toEqual(['a', 'same-looking'])
  })

  it('does not change the original list', () => {
    const list = [paid('a', { recurring: true }), bill('copy', { recurring: true, dueDate: '2026-12-05' })]
    const snapshot = JSON.stringify(list)
    reopenBillInList(list, 'a')
    expect(JSON.stringify(list)).toBe(snapshot)
  })
})
