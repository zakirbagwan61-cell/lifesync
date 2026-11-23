import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, Receipt, Clock, AlertTriangle, IndianRupee } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ItemForm from '../components/common/ItemForm'
import { formatCurrency, formatDate, daysUntil } from '../utils/helpers'

import { CATEGORIES, billFields } from '../utils/fields'
import { useConfirm } from '../context/ConfirmContext'

// Work out which badge a bill should show.
function getStatus(bill) {
  if (bill.status === 'paid') return 'paid'
  const days = daysUntil(bill.dueDate)
  if (days < 0) return 'overdue'
  if (days <= 3) return 'soon'
  return 'pending'
}

export default function Bills() {
  const { bills, addBill, updateBill, deleteBill, markBillPaid } = useApp()
    const confirm = useConfirm()

  const [tab, setTab] = useState('upcoming') // 'upcoming' | 'history'
  const [category, setCategory] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBill, setEditingBill] = useState(null) // null = adding a new bill

  // ----- Numbers for the stat cards -----
  const unpaid = bills.filter((b) => b.status !== 'paid')
  const overdueCount = unpaid.filter((b) => daysUntil(b.dueDate) < 0).length
  const paidCount = bills.length - unpaid.length
  const pendingTotal = unpaid.reduce((sum, b) => sum + b.amount, 0)

  // ----- The list to show: tab + category filter + sorting -----
  const visible = bills
    .filter((b) => (tab === 'history' ? b.status === 'paid' : b.status !== 'paid'))
    .filter((b) => category === 'All' || b.category === category)
    .sort((a, b) =>
      tab === 'history'
        ? b.paidAt.localeCompare(a.paidAt) // newest payment first
        : a.dueDate.localeCompare(b.dueDate) // soonest due first
    )

  const openAdd = () => {
    setEditingBill(null)
    setModalOpen(true)
  }
  const openEdit = (bill) => {
    setEditingBill(bill)
    setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)

  const handleSubmit = (values) => {
    if (editingBill) updateBill(editingBill.id, values)
    else addBill(values)
    closeModal()
  }

  const handleDelete = async (bill) => {
  const ok = await confirm({
    title: 'Delete bill',
    message: `Delete "${bill.title}"? This cannot be undone.`
  })

  if (ok) deleteBill(bill.id)
}

  return (
    <>
      <PageHeader
        title="Bills & Payments"
        subtitle="Track bills, due dates and payment history."
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add bill
          </button>
        }
      />

      <div className="stat-grid">
        <StatCard label="Pending bills" value={unpaid.length} icon={Clock} tone="warning" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} tone="danger" />
        <StatCard label="Paid bills" value={paidCount} icon={CheckCircle} tone="success" />
        <StatCard label="Amount pending" value={formatCurrency(pendingTotal)} icon={IndianRupee} tone="primary" />
      </div>

      {/* Tabs + category filter */}
      <div className="toolbar">
        <div className="tabs">
          <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
            Upcoming
          </button>
          <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            Payment history
          </button>
        </div>

        <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={tab === 'history' ? 'No payments yet' : 'No bills here'}
          message={tab === 'history' ? 'Paid bills will appear here.' : 'Add a bill to start tracking it.'}
          action={
            tab === 'upcoming' && (
              <button className="btn-primary" onClick={openAdd}>
                <Plus size={18} /> Add bill
              </button>
            )
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Bill</th>
                <th>Category</th>
                <th>Amount</th>
                <th>{tab === 'history' ? 'Paid on' : 'Due date'}</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <strong>{bill.title}</strong>
                    {bill.recurring && <div className="muted">Repeats monthly</div>}
                  </td>
                  <td data-label="Category">{bill.category}</td>
                  <td data-label="Amount">{formatCurrency(bill.amount)}</td>
                  <td data-label={tab === 'history' ? 'Paid on' : 'Due date'}>{formatDate(tab === 'history' ? bill.paidAt : bill.dueDate)}</td>
                  <td data-label="Status"><StatusBadge status={getStatus(bill)} /></td>
                  <td>
                    <div className="row-actions">
                      {bill.status !== 'paid' && (
                        <>
                          <button className="icon-btn" title="Mark as paid" onClick={() => markBillPaid(bill.id)}>
                            <CheckCircle size={18} />
                          </button>
                          <button className="icon-btn" title="Edit" onClick={() => openEdit(bill)}>
                            <Pencil size={18} />
                          </button>
                        </>
                      )}
                      <button className="icon-btn" title="Delete" onClick={() => handleDelete(bill)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* The same modal is used for adding and editing */}
      <Modal isOpen={modalOpen} title={editingBill ? 'Edit bill' : 'Add bill'} onClose={closeModal}>
        <ItemForm
          fields={billFields}
          initialValues={editingBill}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitLabel={editingBill ? 'Save changes' : 'Add bill'}
        />
      </Modal>
    </>
  )
}