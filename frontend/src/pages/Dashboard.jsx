import { useState } from 'react'
import { Receipt, CheckCircle, Repeat, FileText, Plus, Inbox } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ItemForm from '../components/common/ItemForm'

// TEMPORARY demo of the Phase 2 shared components.
// The real dashboard widgets replace this in Phase 7.
const demoFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
  { name: 'category', label: 'Category', type: 'select', options: ['Electricity', 'Mobile', 'Internet', 'Rent', 'Other'] },
  { name: 'dueDate', label: 'Due date', type: 'date', required: true },
  { name: 'recurring', label: 'Repeats monthly', type: 'checkbox' },
]

export default function Dashboard() {
  const { userName } = useApp()
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  return (
    <>
      <PageHeader
        title={`Welcome, ${userName}`}
        subtitle="Your upcoming payments, reminders and tasks will appear here."
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={18} /> Try the form
          </button>
        }
      />

      <div className="stat-grid">
        <StatCard label="Pending bills" value={4} icon={Receipt} tone="warning" />
        <StatCard label="Paid bills" value={12} icon={CheckCircle} tone="success" />
        <StatCard label="Monthly subscriptions" value="₹1,299" icon={Repeat} tone="primary" />
        <StatCard label="Documents expiring" value={2} icon={FileText} tone="danger" />
      </div>

      <p style={{ marginBottom: 8 }}>
        Badges: <StatusBadge status="overdue" /> <StatusBadge status="soon" />{' '}
        <StatusBadge status="paid" /> <StatusBadge status="expired" />{' '}
        <StatusBadge status="high" />
      </p>

      {submitted ? (
        <pre className="placeholder-card" style={{ textAlign: 'left' }}>
          {JSON.stringify(submitted, null, 2)}
        </pre>
      ) : (
        <EmptyState icon={Inbox} title="Nothing submitted yet" message="Open the form and save it to see the returned values here." />
      )}

      <Modal isOpen={open} title="Add bill (demo)" onClose={() => setOpen(false)}>
        <ItemForm
          fields={demoFields}
          onCancel={() => setOpen(false)}
          onSubmit={(values) => {
            setSubmitted(values)
            setOpen(false)
          }}
        />
      </Modal>
    </>
  )
}
