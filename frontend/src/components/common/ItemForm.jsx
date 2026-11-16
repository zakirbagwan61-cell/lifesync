import { useState } from 'react'

// A generic form built from a list of field definitions, so Bills, Documents,
// Subscriptions, Tasks and Quick Add can all reuse it.
//
// fields example:
//   [
//     { name: 'title', label: 'Title', type: 'text', required: true },
//     { name: 'amount', label: 'Amount', type: 'number', required: true },
//     { name: 'category', label: 'Category', type: 'select', options: ['Rent', 'Other'] },
//     { name: 'dueDate', label: 'Due date', type: 'date', required: true },
//     { name: 'recurring', label: 'Repeats monthly', type: 'checkbox' },
//   ]
// Supported types: text, number, date, time, select, textarea, checkbox.

// Build the starting values: use initialValues (when editing) or sensible blanks.
function buildInitialValues(fields, initialValues) {
  const values = {}
  fields.forEach((f) => {
    values[f.name] = initialValues?.[f.name] ?? (f.type === 'checkbox' ? false : '')
  })
  return values
}

// Returns an object like { title: 'This field is required' }. Empty object = valid.
function validate(fields, values) {
  const errors = {}
  fields.forEach((f) => {
    const value = values[f.name]
    const isEmpty = value === '' || value === null || value === undefined

    if (f.required && f.type !== 'checkbox' && isEmpty) {
      errors[f.name] = `${f.label} is required`
    } else if (f.type === 'number' && !isEmpty && Number(value) < 0) {
      errors[f.name] = `${f.label} cannot be negative`
    } else if (f.type === 'date' && !isEmpty && Number.isNaN(new Date(value).getTime())) {
      errors[f.name] = `${f.label} must be a valid date`
    }
  })
  return errors
}

export default function ItemForm({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}) {
  const [values, setValues] = useState(() => buildInitialValues(fields, initialValues))
  const [errors, setErrors] = useState({})

  // Update one field as the user types.
  const handleChange = (field, e) => {
    const newValue = field.type === 'checkbox' ? e.target.checked : e.target.value
    setValues({ ...values, [field.name]: newValue })
    if (errors[field.name]) setErrors({ ...errors, [field.name]: undefined }) // clear its error
  }

  const handleSubmit = (e) => {
    e.preventDefault() // stop the browser from reloading the page
    const foundErrors = validate(fields, values)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length > 0) return // stay on the form and show errors

    // Convert number fields from text ("500") to real numbers (500) before returning.
    const cleaned = { ...values }
    fields.forEach((f) => {
      if (f.type === 'number' && cleaned[f.name] !== '') cleaned[f.name] = Number(cleaned[f.name])
    })
    onSubmit(cleaned)
  }

  const renderInput = (f) => {
    const common = { id: f.name, name: f.name, onChange: (e) => handleChange(f, e) }

    if (f.type === 'select') {
      return (
        <select {...common} value={values[f.name]}>
          <option value="">Select...</option>
          {f.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    }
    if (f.type === 'textarea') {
      return <textarea {...common} rows={3} value={values[f.name]} placeholder={f.placeholder} />
    }
    if (f.type === 'checkbox') {
      return <input {...common} type="checkbox" checked={values[f.name]} />
    }
    return (
      <input
        {...common}
        type={f.type || 'text'}
        value={values[f.name]}
        placeholder={f.placeholder}
        min={f.type === 'number' ? 0 : undefined}
      />
    )
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {fields.map((f) => (
        <div key={f.name} className={`form-field ${errors[f.name] ? 'has-error' : ''}`}>
          {f.type === 'checkbox' ? (
            <div className="checkbox-row">
              {renderInput(f)}
              <label htmlFor={f.name}>{f.label}</label>
            </div>
          ) : (
            <>
              <label htmlFor={f.name}>
                {f.label}
                {f.required && <span className="required"> *</span>}
              </label>
              {renderInput(f)}
            </>
          )}
          {errors[f.name] && <div className="form-error">{errors[f.name]}</div>}
        </div>
      ))}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
