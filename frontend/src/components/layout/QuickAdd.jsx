import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import Modal from '../common/Modal'
import ItemForm from '../common/ItemForm'
import { todayString } from '../../utils/helpers'
import { carryOverValues, hasCarriedChanges, mergeStartValues, rememberShared } from '../../utils/quickAdd'
import {
  billFields, documentFields, subscriptionFields, taskFields, appointmentFields,
} from '../../utils/fields'

// The things you can add from anywhere. `defaults` pre-fills the date with today.
const TYPES = [
  { key: 'bill', label: 'Bill', path: '/bills', fields: billFields, defaults: () => ({ dueDate: todayString() }) },
  { key: 'task', label: 'Task', path: '/tasks', fields: taskFields, defaults: () => ({ deadline: todayString() }) },
  { key: 'appointment', label: 'Appointment', path: '/tasks', fields: appointmentFields, defaults: () => ({ date: todayString() }) },
  { key: 'subscription', label: 'Subscription', path: '/subscriptions', fields: subscriptionFields, defaults: () => ({ nextRenewal: todayString() }) },
  { key: 'document', label: 'Document', path: '/documents', fields: documentFields, defaults: () => ({}) },
]

// A popup that lets the user pick what to add, fill a short form, and save.
// Switching type keeps what was typed: name, amount and date move to the new form, and going back
// to a type restores its own entries.
export default function QuickAdd({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { addBill, addTask, addAppointment, addSubscription, addDocument } = useApp()
  const [type, setType] = useState('bill')
  const [carried, setCarried] = useState({}) // values brought over from the previous type
  const latest = useRef(null) // what is typed in the form on screen
  const shared = useRef({}) // name, amount and date remembered from every form visited
  const drafts = useRef({}) // what was typed in each type's form before switching away

  // A fresh start every time the dialog is closed.
  useEffect(() => {
    if (!isOpen) {
      drafts.current = {}
      shared.current = {}
      latest.current = null
      setCarried({})
    }
  }, [isOpen])

  // Which context action saves each type.
  const adders = {
    bill: addBill,
    task: addTask,
    appointment: addAppointment,
    subscription: addSubscription,
    document: addDocument,
  }

  const current = TYPES.find((t) => t.key === type)
  const defaults = current.defaults()
  const startValues = mergeStartValues(defaults, drafts.current[type], carried)
  const kept = hasCarriedChanges(carried, defaults) || hasCarriedChanges(drafts.current[type], defaults)

  const switchType = (next) => {
    if (next === type) return
    const nextConfig = TYPES.find((t) => t.key === next)
    if (latest.current) drafts.current[type] = latest.current
    shared.current = rememberShared(shared.current, latest.current)
    setCarried(carryOverValues(shared.current, nextConfig.fields))
    latest.current = null
    setType(next)
  }

  const handleSubmit = (values) => {
    adders[type](values)
    onClose()
    navigate(current.path) // jump to the page so the user sees the new item
  }

  return (
    <Modal isOpen={isOpen} title="Quick Add" onClose={onClose}>
      <div className="type-chips">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`chip ${type === t.key ? 'active' : ''}`}
            onClick={() => switchType(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {kept && (
        <p className="muted quick-add-note" role="status">Your entries were kept. Check the fields below.</p>
      )}

      {/* key={type} builds a fresh form when the type changes; the typed values are passed back in */}
      <ItemForm
        key={type}
        fields={current.fields}
        initialValues={startValues}
        baselineValues={defaults}
        onValuesChange={(values) => { latest.current = values }}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel={`Add ${current.label.toLowerCase()}`}
      />
    </Modal>
  )
}
