// Form validation rules, kept separate from the form component so they can be tested.
//
// A field definition (see utils/fields.js) can use:
//   required: true       the field must not be empty
//   positive: true       a number field must be greater than 0 (amounts and costs)
//   max: 10000000        a number field must not be more than this
//   decimals: 2          a number field may have at most this many decimal places (paise)
//   notBefore: 'name'    a date field must not be earlier than another date field
//   maxLength: 80        a text field accepts at most this many characters (set on the input itself)

// Limits shared by every form.
export const MAX_AMOUNT = 10000000 // ₹1 crore: far above any real bill, and keeps totals readable
export const MAX_DECIMALS = 2 // paise
export const MIN_DATE = '1900-01-01'
export const MAX_DATE = '2100-12-31'

// "Amount (₹)" -> "Amount", "Expiry date (leave empty if it never expires)" -> "Expiry date"
const shortLabel = (label) => label.replace(/\s*\(.*\)\s*$/, '')

// 1,234,567 -> "12,34,567" style grouping, used in messages
const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(n)

// How many digits after the decimal point a typed number has (1234.5 -> 1, 12.345 -> 3, 12 -> 0).
// Works from the number's value, so float noise such as 1.15 * 100 never counts as an extra digit.
function decimalPlaces(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  for (let places = 0; places <= 6; places += 1) {
    if (Math.abs(n * 10 ** places - Math.round(n * 10 ** places)) < 1e-7) return places
  }
  return 7
}

const isTextField = (f) => !f.type || f.type === 'text' || f.type === 'textarea'

// Remove spaces at the start and end of text and textarea values. Spaces inside the text are kept.
export function trimValues(fields, values) {
  const trimmed = { ...values }
  fields.forEach((f) => {
    if (isTextField(f) && typeof trimmed[f.name] === 'string') trimmed[f.name] = trimmed[f.name].trim()
  })
  return trimmed
}

// Returns an object like { title: 'Bill name is required' }. An empty object means the values are valid.
// Pass values that have already gone through trimValues, so "   " counts as empty.
export function validateFields(fields, values) {
  const errors = {}
  fields.forEach((f) => {
    const value = values[f.name]
    const isEmpty = value === '' || value === null || value === undefined

    if (f.required && f.type !== 'checkbox' && isEmpty) {
      errors[f.name] = `${shortLabel(f.label)} is required`
    } else if (f.type === 'number' && !isEmpty && f.positive && !(Number(value) > 0)) {
      errors[f.name] = `${shortLabel(f.label)} must be greater than 0`
    } else if (f.type === 'number' && !isEmpty && Number(value) < 0) {
      errors[f.name] = `${shortLabel(f.label)} cannot be negative`
    } else if (f.type === 'number' && !isEmpty && f.max !== undefined && Number(value) > f.max) {
      errors[f.name] = `${shortLabel(f.label)} cannot be more than ${formatNumber(f.max)}`
    } else if (f.type === 'number' && !isEmpty && f.decimals !== undefined && decimalPlaces(value) > f.decimals) {
      errors[f.name] = f.decimals === 0
        ? `${shortLabel(f.label)} must be a whole number`
        : `${shortLabel(f.label)} can have at most ${f.decimals} decimal places`
    } else if (f.type === 'date' && !isEmpty && Number.isNaN(new Date(value).getTime())) {
      errors[f.name] = `${f.label} must be a valid date`
    } else if (f.type === 'date' && !isEmpty && (value < MIN_DATE || value > MAX_DATE)) {
      errors[f.name] = `${shortLabel(f.label)} must be between ${MIN_DATE.slice(0, 4)} and ${MAX_DATE.slice(0, 4)}`
    } else if (f.type === 'date' && !isEmpty && f.notBefore) {
      const other = fields.find((o) => o.name === f.notBefore)
      const otherValue = values[f.notBefore]
      // Only compare when the other date is filled in and is a real date (both are YYYY-MM-DD, so text order is date order)
      if (other && otherValue && !Number.isNaN(new Date(otherValue).getTime()) && value < otherValue) {
        errors[f.name] = `${shortLabel(f.label)} cannot be earlier than the ${shortLabel(other.label).toLowerCase()}`
      }
    }
  })
  return errors
}
