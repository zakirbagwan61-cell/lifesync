import { describe, expect, it } from 'vitest'
import { trimValues, validateFields } from './validation'
import {
  appointmentFields, billFields, documentFields, subscriptionFields, taskFields,
} from './fields'

const validBill = { title: 'Electricity bill', category: 'Electricity', amount: '1850', dueDate: '2026-11-27', recurring: false }
const validDoc = { type: 'PAN', holder: 'Asha', number: 'ABCDE1234F', issueDate: '2020-01-10', expiryDate: '2030-01-10', notes: '' }

const check = (fields, values) => validateFields(fields, trimValues(fields, values))

describe('trimValues', () => {
  it('removes spaces around text and textarea values only', () => {
    const t = trimValues(documentFields, { ...validDoc, holder: '  Asha  ', notes: '\n note \t', type: 'PAN' })
    expect(t.holder).toBe('Asha')
    expect(t.notes).toBe('note')
  })

  it('keeps spaces inside the text', () => {
    expect(trimValues(billFields, { ...validBill, title: ' Home   internet ' }).title).toBe('Home   internet')
  })

  it('does not touch numbers, dates, selects or checkboxes', () => {
    const values = { ...validBill, amount: ' 5 ', recurring: true }
    const t = trimValues(billFields, values)
    expect(t.amount).toBe(' 5 ')
    expect(t.category).toBe('Electricity')
    expect(t.recurring).toBe(true)
  })

  it('does not change the original object', () => {
    const values = { ...validBill, title: ' x ' }
    trimValues(billFields, values)
    expect(values.title).toBe(' x ')
  })
})

describe('required text', () => {
  it.each([
    ['an empty string', ''],
    ['spaces only', '     '],
    ['tabs and new lines only', '\t \n'],
  ])('rejects %s', (_label, title) => {
    expect(check(billFields, { ...validBill, title })).toEqual({ title: 'Bill name is required' })
  })

  it('accepts text with surrounding spaces (it is trimmed)', () => {
    expect(check(billFields, { ...validBill, title: '  Rent  ' })).toEqual({})
  })

  it.each([
    ['task', taskFields, { title: '   ', priority: 'High', deadline: '2026-12-01' }, 'title'],
    ['appointment', appointmentFields, { title: ' ', date: '2026-12-01', time: '10:00', location: '' }, 'title'],
    ['subscription', subscriptionFields, { name: '  ', cost: '10', cycle: 'Monthly', nextRenewal: '2026-12-01', autoRenew: true }, 'name'],
    ['document holder', documentFields, { ...validDoc, holder: '   ' }, 'holder'],
    ['document number', documentFields, { ...validDoc, number: ' ' }, 'number'],
  ])('rejects a whitespace-only %s', (_label, fields, values, key) => {
    expect(check(fields, values)[key]).toMatch(/is required$/)
  })

  it('lets optional text stay empty or spaces only', () => {
    expect(check(appointmentFields, { title: 'Dentist', date: '2026-12-01', time: '10:00', location: '   ' })).toEqual({})
    expect(check(documentFields, { ...validDoc, notes: '   ' })).toEqual({})
  })
})

describe('amounts and costs must be greater than zero', () => {
  it.each([
    ['0', 'Amount must be greater than 0'],
    ['0.00', 'Amount must be greater than 0'],
    ['-5', 'Amount must be greater than 0'],
  ])('bill amount %s is rejected', (amount, message) => {
    expect(check(billFields, { ...validBill, amount })).toEqual({ amount: message })
  })

  it('accepts small and decimal bill amounts', () => {
    expect(check(billFields, { ...validBill, amount: '0.5' })).toEqual({})
    expect(check(billFields, { ...validBill, amount: 1 })).toEqual({})
    expect(check(billFields, { ...validBill, amount: '1850.75' })).toEqual({})
  })

  it('still reports a missing amount as required', () => {
    expect(check(billFields, { ...validBill, amount: '' })).toEqual({ amount: 'Amount (₹) is required' })
  })

  it('applies to subscription cost with its own name in the message', () => {
    const sub = { name: 'Netflix', cost: '0', cycle: 'Monthly', nextRenewal: '2026-12-01', autoRenew: true }
    expect(check(subscriptionFields, sub)).toEqual({ cost: 'Cost must be greater than 0' })
    expect(check(subscriptionFields, { ...sub, cost: '649' })).toEqual({})
  })

  it('does not apply to number fields that are not marked positive', () => {
    const fields = [{ name: 'qty', label: 'Quantity', type: 'number' }]
    expect(validateFields(fields, { qty: '0' })).toEqual({})
    expect(validateFields(fields, { qty: '-1' })).toEqual({ qty: 'Quantity cannot be negative' })
  })
})

describe('document dates', () => {
  it('rejects an expiry date earlier than the issue date', () => {
    expect(check(documentFields, { ...validDoc, issueDate: '2026-05-10', expiryDate: '2026-05-09' })).toEqual({
      expiryDate: 'Expiry date cannot be earlier than the issue date',
    })
  })

  it('accepts the same day and later dates', () => {
    expect(check(documentFields, { ...validDoc, issueDate: '2026-05-10', expiryDate: '2026-05-10' })).toEqual({})
    expect(check(documentFields, { ...validDoc, issueDate: '2026-05-10', expiryDate: '2036-05-10' })).toEqual({})
  })

  it('compares across month and year boundaries', () => {
    expect(check(documentFields, { ...validDoc, issueDate: '2026-12-31', expiryDate: '2027-01-01' })).toEqual({})
    expect(check(documentFields, { ...validDoc, issueDate: '2027-01-01', expiryDate: '2026-12-31' }).expiryDate).toBeDefined()
  })

  it('does not compare when either date is empty (never expires, or no issue date)', () => {
    expect(check(documentFields, { ...validDoc, expiryDate: '' })).toEqual({})
    expect(check(documentFields, { ...validDoc, issueDate: '' })).toEqual({})
    expect(check(documentFields, { ...validDoc, issueDate: '', expiryDate: '' })).toEqual({})
  })

  it('allows a past expiry date (an expired document is still a valid record)', () => {
    expect(check(documentFields, { ...validDoc, issueDate: '2015-01-01', expiryDate: '2020-01-01' })).toEqual({})
  })
})

describe('editing existing records', () => {
  it('accepts the seed-style records unchanged', () => {
    expect(check(billFields, { title: 'Water bill', category: 'Other', amount: 320, dueDate: '2026-10-30', recurring: false })).toEqual({})
    expect(check(documentFields, { type: 'Aadhaar', holder: 'Your Name', number: 'XXXX XXXX 1234', issueDate: '2018-05-10', expiryDate: '', notes: '' })).toEqual({})
    expect(check(subscriptionFields, { name: 'Netflix', cost: 649, cycle: 'Monthly', nextRenewal: '2026-12-01', autoRenew: true })).toEqual({})
    expect(check(taskFields, { title: 'Pay school fees', priority: 'High', deadline: '2026-11-25' })).toEqual({})
  })

  it('reports every problem at once', () => {
    const errors = check(billFields, { title: ' ', category: '', amount: '0', dueDate: '', recurring: false })
    expect(Object.keys(errors).sort()).toEqual(['amount', 'category', 'dueDate', 'title'])
  })
})

describe('field limits', () => {
  it('every text field that takes free text has a maxLength', () => {
    const lists = [billFields, documentFields, subscriptionFields, taskFields, appointmentFields]
    const free = lists.flat().filter((f) => !f.type || f.type === 'text' || f.type === 'textarea')
    expect(free.length).toBeGreaterThan(5)
    free.forEach((f) => expect(f.maxLength, f.name).toBeGreaterThan(0))
  })

  it('limits are generous enough for normal use', () => {
    const limit = (fields, name) => fields.find((f) => f.name === name).maxLength
    expect(limit(billFields, 'title')).toBeGreaterThanOrEqual(60)
    expect(limit(documentFields, 'notes')).toBeGreaterThanOrEqual(300)
    expect(limit(documentFields, 'number')).toBeGreaterThanOrEqual(30)
  })
})
