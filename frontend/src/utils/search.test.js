import { describe, expect, it } from 'vitest'
import { buildSearchItems, filterSearchItems, sortSearchResults } from './search'

const data = {
  bills: [{ id: 'b1', title: 'Electricity bill', category: 'Utilities', amount: 1850, dueDate: '2026-12-01', status: 'pending' }],
  documents: [{ id: 'd1', type: 'Passport', holder: 'Asha', number: 'P1234567', notes: 'renew early', expiryDate: '2027-01-08' }],
  subscriptions: [{ id: 's1', name: 'Netflix', cost: 649, cycle: 'Monthly', nextRenewal: '2026-12-05' }],
  tasks: [{ id: 't1', title: 'Buy groceries', priority: 'High', deadline: '2026-11-24', completed: true }],
  appointments: [{ id: 'a1', title: 'Dentist', time: '10:30', location: 'Smile Clinic', date: '2026-11-30', completed: false }],
}

const items = buildSearchItems(data)
const byKind = (kind) => items.find((i) => i.kind === kind)

describe('buildSearchItems', () => {
  it('creates one item per record, across all five modules', () => {
    expect(items.map((i) => i.kind)).toEqual(['bill', 'document', 'subscription', 'task', 'appointment'])
  })

  it('gives every kind its date, so the list can sort and show a status badge', () => {
    expect(byKind('bill').date).toBe('2026-12-01')
    expect(byKind('document').date).toBe('2027-01-08') // regression: used to be dropped
    expect(byKind('subscription').date).toBe('2026-12-05')
    expect(byKind('task').date).toBe('2026-11-24')
    expect(byKind('appointment').date).toBe('2026-11-30')
  })

  it('carries completed state', () => {
    expect(byKind('document').completed).toBe(false)
    expect(byKind('task').completed).toBe(true)
    expect(byKind('bill').completed).toBe(false)
  })

  it('shows a masked document number but still searches the full one', () => {
    const doc = byKind('document')
    expect(doc.meta).not.toContain('P1234567')
    expect(doc.text).toContain('p1234567')
  })

  it('keeps sourceId and a unique id per item', () => {
    expect(byKind('bill').sourceId).toBe('b1')
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
  })

  it('shows appointment time and location', () => {
    expect(byKind('appointment').meta).toBe('10:30 am · Smile Clinic')
  })
})

describe('filterSearchItems', () => {
  it('matches case-insensitively, ignoring surrounding spaces', () => {
    expect(filterSearchItems(items, '  NETFLIX ').map((i) => i.kind)).toEqual(['subscription'])
  })

  it('finds documents by holder, number and notes', () => {
    expect(filterSearchItems(items, 'asha')).toHaveLength(1)
    expect(filterSearchItems(items, '1234567')).toHaveLength(1)
    expect(filterSearchItems(items, 'renew early')).toHaveLength(1)
  })

  it('returns nothing for an empty or missing query', () => {
    expect(filterSearchItems(items, '')).toEqual([])
    expect(filterSearchItems(items, '   ')).toEqual([])
    expect(filterSearchItems(items, undefined)).toEqual([])
  })
})

describe('sortSearchResults', () => {
  it('sorts by date and puts undated items last without changing the input', () => {
    const input = [{ id: 'x', date: undefined }, { id: 'b', date: '2026-12-01' }, { id: 'a', date: '2026-11-01' }]
    expect(sortSearchResults(input).map((i) => i.id)).toEqual(['a', 'b', 'x'])
    expect(input[0].id).toBe('x')
  })
})
