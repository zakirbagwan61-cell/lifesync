import { describe, expect, it } from 'vitest'
import {
  buildSearchItems, filterSearchItems, rankSearchResults, searchItemPath, sortSearchResults,
} from './search'

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

describe('searchItemPath', () => {
  it('links to the exact item on its own page', () => {
    expect(searchItemPath(byKind('bill'))).toBe('/bills?focus=b1')
    expect(searchItemPath(byKind('document'))).toBe('/documents?focus=d1')
    expect(searchItemPath(byKind('subscription'))).toBe('/subscriptions?focus=s1')
    expect(searchItemPath(byKind('task'))).toBe('/tasks?focus=t1')
  })

  it('opens appointments on the Appointments tab and encodes odd ids', () => {
    expect(searchItemPath(byKind('appointment'))).toBe('/tasks?focus=a1&tab=appointments')
    expect(searchItemPath({ kind: 'bill', sourceId: 'a b&c' })).toBe('/bills?focus=a%20b%26c')
  })
})

describe('rankSearchResults', () => {
  const r = (id, title, date) => ({ id, title, date })

  it('puts titles starting with the query first, then titles containing it, then the rest', () => {
    const ranked = rankSearchResults(
      [r('c', 'Other', '2026-01-01'), r('b', 'My bill', '2026-01-02'), r('a', 'Bill payment', '2026-03-01')],
      'bill'
    )
    expect(ranked.map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('breaks ties by date and does not change the input', () => {
    const input = [r('late', 'Rent', '2026-05-01'), r('early', 'Rent', '2026-02-01')]
    expect(rankSearchResults(input, 'rent').map((x) => x.id)).toEqual(['early', 'late'])
    expect(input[0].id).toBe('late')
  })
})
