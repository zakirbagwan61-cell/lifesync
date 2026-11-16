import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import Modal from '../common/Modal'
import ItemForm from '../common/ItemForm'
import { todayString } from '../../utils/helpers'
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
export default function QuickAdd({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { addBill, addTask, addAppointment, addSubscription, addDocument } = useApp()
  const [type, setType] = useState('bill')

  // Which context action saves each type.
  const adders = {
    bill: addBill,
    task: addTask,
    appointment: addAppointment,
    subscription: addSubscription,
    document: addDocument,
  }

  const current = TYPES.find((t) => t.key === type)

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
            onClick={() => setType(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* key={type} makes React build a fresh form every time the type changes */}
      <ItemForm
        key={type}
        fields={current.fields}
        initialValues={current.defaults()}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel={`Add ${current.label.toLowerCase()}`}
      />
    </Modal>
  )
}