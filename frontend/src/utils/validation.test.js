import { describe, expect, it } from 'vitest'
import { MAX_AMOUNT, MAX_DATE, MIN_DATE, trimValues, validateFields } from './validation'
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
    expect(check(billFields, { ...validBill, amount: '' })).toEqual({ amount: 'Amount is required' })
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

describe('amount limits', () => {
  it('allows the largest amount and rejects anything above it, with the limit in the message', () => {
    expect(check(billFields, { ...validBill, amount: String(MAX_AMOUNT) })).toEqual({})
    expect(check(billFields, { ...validBill, amount: String(MAX_AMOUNT + 1) }))
      .toEqual({ amount: 'Amount cannot be more than 1,00,00,000' })
    expect(check(billFields, { ...validBill, amount: '1e12' })).toEqual({ amount: 'Amount cannot be more than 1,00,00,000' })
  })

  it('applies the same limit to subscription cost', () => {
    const sub = { name: 'Netflix', cost: '99999999', cycle: 'Monthly', nextRenewal: '2026-12-01', autoRenew: true }
    expect(check(subscriptionFields, sub)).toEqual({ cost: 'Cost cannot be more than 1,00,00,000' })
  })

  it.each(['1850.75', '0.01', '12.5', '12.50', '99999.99', 1.15, 0.1 + 0.2])('accepts paise: %s', (amount) => {
    expect(check(billFields, { ...validBill, amount })).toEqual({})
  })

  it.each(['12.345', '0.001', '1850.755', '9.999'])('rejects more than 2 decimal places: %s', (amount) => {
    expect(check(billFields, { ...validBill, amount })).toEqual({ amount: 'Amount can have at most 2 decimal places' })
  })

  it('reports a negative number on a field that is not "positive" with the short label', () => {
    const fields = [{ name: 'qty', label: 'Quantity (units)', type: 'number' }]
    expect(validateFields(fields, { qty: '-1' })).toEqual({ qty: 'Quantity cannot be negative' })
  })

  it('supports whole-number-only fields', () => {
    const fields = [{ name: 'days', label: 'Days', type: 'number', decimals: 0 }]
    expect(validateFields(fields, { days: '3' })).toEqual({})
    expect(validateFields(fields, { days: '3.5' })).toEqual({ days: 'Days must be a whole number' })
  })
})

describe('date limits', () => {
  it('accepts dates between 1900 and 2100, including the edges', () => {
    expect(check(billFields, { ...validBill, dueDate: MIN_DATE })).toEqual({})
    expect(check(billFields, { ...validBill, dueDate: MAX_DATE })).toEqual({})
    expect(check(billFields, { ...validBill, dueDate: '2026-12-31' })).toEqual({})
  })

  it.each(['0001-01-01', '1899-12-31', '2101-01-01', '275760-09-13', '9999-12-31'])('rejects %s', (dueDate) => {
    expect(check(billFields, { ...validBill, dueDate })).toEqual({ dueDate: 'Due date must be between 1900 and 2100' })
  })

  it('checks optional dates only when they are filled in', () => {
    expect(check(documentFields, { ...validDoc, issueDate: '', expiryDate: '' })).toEqual({})
    expect(check(documentFields, { ...validDoc, expiryDate: '2150-01-01' }))
      .toEqual({ expiryDate: 'Expiry date must be between 1900 and 2100' })
  })

  it('still reports a not-before problem for in-range dates', () => {
    expect(check(documentFields, { ...validDoc, issueDate: '2030-01-10', expiryDate: '2029-01-10' }))
      .toEqual({ expiryDate: 'Expiry date cannot be earlier than the issue date' })
  })
})
