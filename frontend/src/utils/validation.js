// Form validation rules, kept separate from the form component so they can be tested.
//
// A field definition (see utils/fields.js) can use:
//   required: true       the field must not be empty
//   positive: true       a number field must be greater than 0 (amounts and costs)
//   notBefore: 'name'    a date field must not be earlier than another date field
//   maxLength: 80        a text field accepts at most this many characters (set on the input itself)

// "Amount (₹)" -> "Amount", "Expiry date (leave empty if it never expires)" -> "Expiry date"
const shortLabel = (label) => label.replace(/\s*\(.*\)\s*$/, '')

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
      errors[f.name] = `${f.label} is required`
    } else if (f.type === 'number' && !isEmpty && f.positive && !(Number(value) > 0)) {
      errors[f.name] = `${shortLabel(f.label)} must be greater than 0`
    } else if (f.type === 'number' && !isEmpty && Number(value) < 0) {
      errors[f.name] = `${f.label} cannot be negative`
    } else if (f.type === 'date' && !isEmpty && Number.isNaN(new Date(value).getTime())) {
      errors[f.name] = `${f.label} must be a valid date`
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
