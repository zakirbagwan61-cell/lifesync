import { describe, expect, it } from 'vitest'
import { carryOverValues, hasCarriedChanges, mergeStartValues, rememberShared } from './quickAdd'
import {
  appointmentFields, billFields, documentFields, subscriptionFields, taskFields,
} from './fields'

describe('carryOverValues', () => {
  it('moves a bill title and date to a task', () => {
    expect(carryOverValues({ title: 'Rent', dueDate: '2026-12-01', amount: 500 }, taskFields))
      .toEqual({ title: 'Rent', deadline: '2026-12-01' })
  })

  it('translates title to the subscription name and amount to its cost', () => {
    expect(carryOverValues({ title: 'Netflix', amount: 649, dueDate: '2026-12-05' }, subscriptionFields))
      .toEqual({ name: 'Netflix', cost: 649, nextRenewal: '2026-12-05' })
  })

  it('moves a subscription name and cost back to a bill', () => {
    expect(carryOverValues({ name: 'Gym', cost: 900, nextRenewal: '2026-12-09' }, billFields))
      .toEqual({ title: 'Gym', amount: 900, dueDate: '2026-12-09' })
  })

  it('only fills fields the new form has', () => {
    expect(carryOverValues({ title: 'Dentist', date: '2026-12-02', amount: 5 }, documentFields)).toEqual({})
    expect(carryOverValues({ title: 'Dentist', date: '2026-12-02' }, appointmentFields))
      .toEqual({ title: 'Dentist', date: '2026-12-02' })
  })

  it('skips blank and missing values, and keeps a typed 0', () => {
    expect(carryOverValues({ title: '   ', amount: '' }, taskFields)).toEqual({})
    expect(carryOverValues(null, taskFields)).toEqual({})
    expect(carryOverValues({ amount: 0 }, subscriptionFields)).toEqual({ cost: 0 })
  })
})

describe('mergeStartValues', () => {
  const defaults = { deadline: '2026-11-24' }

  it('layers defaults, then saved entries, then carried values', () => {
    expect(mergeStartValues(defaults, { title: 'Old', priority: 'High' }, { title: 'New', deadline: '2026-12-01' }))
      .toEqual({ title: 'New', priority: 'High', deadline: '2026-12-01' })
  })

  it('does not let blank saved values hide a default', () => {
    expect(mergeStartValues(defaults, { deadline: '', title: '' }, {})).toEqual({ deadline: '2026-11-24' })
  })

  it('keeps saved checkbox values, including false', () => {
    expect(mergeStartValues({}, { recurring: false }, {})).toEqual({ recurring: false })
  })

  it('works with nothing saved or carried', () => {
    expect(mergeStartValues(defaults)).toEqual(defaults)
  })
})

describe('hasCarriedChanges', () => {
  it('is true only when something differs from the defaults', () => {
    expect(hasCarriedChanges({ deadline: '2026-11-24' }, { deadline: '2026-11-24' })).toBe(false)
    expect(hasCarriedChanges({ title: 'Rent' }, { deadline: '2026-11-24' })).toBe(true)
    expect(hasCarriedChanges(undefined, {})).toBe(false)
  })
})

describe('rememberShared', () => {
  it('keeps the amount typed on an earlier form across several switches', () => {
    let shared = rememberShared({}, { title: 'Gym', amount: 900, dueDate: '2026-12-09', category: 'Other' })
    shared = rememberShared(shared, { title: 'Gym', deadline: '2026-12-09', priority: 'High' }) // task form has no amount
    expect(carryOverValues(shared, subscriptionFields))
      .toEqual({ name: 'Gym', cost: 900, nextRenewal: '2026-12-09' })
  })

  it('lets a newer value replace the remembered one', () => {
    const shared = rememberShared({ title: 'Old' }, { name: 'New' })
    expect(shared.title).toBe('New')
  })

  it('forgets a value the user cleared, but not one the form simply has no field for', () => {
    expect(rememberShared({ title: 'Gym', amount: 9 }, { title: '', deadline: '' })).toEqual({ amount: 9 })
  })

  it('does not change what was passed in', () => {
    const previous = { title: 'Gym' }
    rememberShared(previous, { title: '' })
    expect(previous).toEqual({ title: 'Gym' })
  })
})
