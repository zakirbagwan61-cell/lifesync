import { useEffect, useRef, useState } from 'react'
import { useModalDirty } from './Modal'
import { MAX_DATE, MIN_DATE, trimValues, validateFields } from '../../utils/validation'

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

export default function ItemForm({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  baselineValues, // what counts as "unchanged" for the unsaved-changes prompt (defaults to initialValues)
  onValuesChange, // called with the current values whenever they change (used by Quick Add)
}) {
  const [values, setValues] = useState(() => buildInitialValues(fields, initialValues))
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)

  // Tell the surrounding Modal (if any) when something has been typed, so it can
  // ask before throwing the changes away.
  const startValues = useRef(null)
  if (startValues.current === null) startValues.current = buildInitialValues(fields, baselineValues ?? initialValues)
  useModalDirty(fields.some((f) => String(values[f.name]) !== String(startValues.current[f.name])))

  // Let a parent (Quick Add) keep a copy of what has been typed.
  useEffect(() => {
    onValuesChange?.(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values])

  // Update one field as the user types.
  const handleChange = (field, e) => {
    const newValue = field.type === 'checkbox' ? e.target.checked : e.target.value
    setValues({ ...values, [field.name]: newValue })
    if (errors[field.name]) setErrors({ ...errors, [field.name]: undefined }) // clear its error
  }

  const handleSubmit = (e) => {
    e.preventDefault() // stop the browser from reloading the page
    // Remove spaces around typed text first, so "   " counts as empty and saved text is tidy
    const trimmed = trimValues(fields, values)
    setValues(trimmed)
    const foundErrors = validateFields(fields, trimmed)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length > 0) {
      // Stay on the form, show the errors and put the cursor in the first field that needs fixing
      const firstInvalid = fields.find((f) => foundErrors[f.name])
      formRef.current?.elements.namedItem(firstInvalid.name)?.focus()
      return
    }

    // Convert number fields from text ("500") to real numbers (500) before returning.
    const cleaned = { ...trimmed }
    fields.forEach((f) => {
      if (f.type === 'number' && cleaned[f.name] !== '') cleaned[f.name] = Number(cleaned[f.name])
    })
    onSubmit(cleaned)
  }

  const renderInput = (f) => {
        const common = {
      id: f.name,
      name: f.name,
      onChange: (e) => handleChange(f, e),
      'aria-invalid': errors[f.name] ? 'true' : undefined, // tells screen readers the field has an error
      'aria-describedby': errors[f.name] ? `${f.name}-error` : undefined, // reads the message with the field
      'aria-required': f.required && f.type !== 'checkbox' ? 'true' : undefined,
    }

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
      return <textarea {...common} rows={3} value={values[f.name]} maxLength={f.maxLength} placeholder={f.placeholder} />
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
        maxLength={f.maxLength}
        min={f.type === 'number' ? 0 : f.type === 'date' ? MIN_DATE : undefined}
        max={f.type === 'number' ? f.max : f.type === 'date' ? MAX_DATE : undefined}
        step={f.type === 'number' && f.decimals !== undefined ? 1 / 10 ** f.decimals : undefined}
      />
    )
  }

  return (
    <form className="form" ref={formRef} onSubmit={handleSubmit} noValidate>
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
          {errors[f.name] && (
            <div className="form-error" id={`${f.name}-error`} role="alert">{errors[f.name]}</div>
          )}
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
