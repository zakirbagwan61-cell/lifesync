import { useState } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, Repeat, IndianRupee, CalendarClock, Layers } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ItemForm from '../components/common/ItemForm'
import { formatCurrency, formatDate, daysUntil } from '../utils/helpers'

import { CYCLES, subscriptionFields } from '../utils/fields'
import { useConfirm } from '../context/ConfirmContext'

// A subscription is "renewing soon" when it renews within this many days.
const SOON_DAYS = 7



// Cost converted to a per-month figure, so monthly and yearly plans can be added together.
// Example: a Yearly plan of ₹1200 counts as ₹100 per month.
const monthlyCost = (sub) => (sub.cycle === 'Yearly' ? sub.cost / 12 : sub.cost)

// Badge color + text for the renewal date.
function getRenewalInfo(sub) {
  const days = daysUntil(sub.nextRenewal)
  if (days < 0) return { tone: 'danger', text: `Renewal passed ${Math.abs(days)}d ago` }
  if (days === 0) return { tone: 'warning', text: 'Renews today' }
  if (days <= SOON_DAYS) return { tone: 'warning', text: `Renews in ${days}d` }
  return { tone: 'neutral', text: `Renews in ${days}d` }
}

export default function Subscriptions() {
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    renewSubscription,
  } = useApp()
  const confirm = useConfirm()

  const [cycleFilter, setCycleFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState(null) // null = adding a new subscription

  // ----- Numbers for the stat cards -----
  const perMonthTotal = subscriptions.reduce((sum, s) => sum + monthlyCost(s), 0)
  const perYearTotal = perMonthTotal * 12
  const renewingSoon = subscriptions.filter((s) => daysUntil(s.nextRenewal) <= SOON_DAYS).length

  // ----- The list to show: cycle filter, soonest renewal first -----
  const visible = subscriptions
    .filter((s) => cycleFilter === 'All' || s.cycle === cycleFilter)
    .sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal))

  const openAdd = () => {
    setEditingSub(null)
    setModalOpen(true)
  }
  const openEdit = (sub) => {
    setEditingSub(sub)
    setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)

  const handleSubmit = (values) => {
    if (editingSub) updateSubscription(editingSub.id, values)
    else addSubscription(values)
    closeModal()
  }

    const handleDelete = async (sub) => {
    const ok = await confirm({ title: 'Delete subscription', message: `Delete "${sub.name}"? This cannot be undone.` })
    if (ok) deleteSubscription(sub.id)
  }

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="Track renewals and total subscription spending."
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add subscription
          </button>
        }
      />

      <div className="stat-grid">
        <StatCard label="Active subscriptions" value={subscriptions.length} icon={Layers} tone="primary" />
        <StatCard label="Total per month" value={formatCurrency(Math.round(perMonthTotal))} icon={IndianRupee} tone="primary" />
        <StatCard label="Total per year" value={formatCurrency(Math.round(perYearTotal))} icon={Repeat} tone="primary" />
        <StatCard label={`Renewing in ${SOON_DAYS} days`} value={renewingSoon} icon={CalendarClock} tone="warning" />
      </div>

      <div className="toolbar">
        <select className="filter-select" value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)}>
          <option value="All">All billing cycles</option>
          {CYCLES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No subscriptions here"
          message="Add a subscription to track its renewal date and cost."
          action={
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={18} /> Add subscription
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Cost</th>
                <th>Next renewal</th>
                <th>Auto-renew</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((sub) => {
                const renewal = getRenewalInfo(sub)
                return (
                  <tr key={sub.id}>
                    <td><strong>{sub.name}</strong></td>
                    <td data-label="Cost">
                      {formatCurrency(sub.cost)}
                      <span className="muted"> / {sub.cycle === 'Yearly' ? 'year' : 'month'}</span>
                      {sub.cycle === 'Yearly' && (
                        <div className="muted">≈ {formatCurrency(Math.round(monthlyCost(sub)))} / month</div>
                      )}
                    </td>
                    <td data-label="Next renewal">
                      {formatDate(sub.nextRenewal)}
                      <div>
                        <span className={`badge tone-${renewal.tone}`}>{renewal.text}</span>
                      </div>
                    </td>
                    <td data-label="Auto-renew">
                      {/* Click the badge to switch auto-renew on or off */}
                      <button
                        className={`badge tone-${sub.autoRenew ? 'success' : 'neutral'}`}
                        style={{ border: 'none' }}
                        title="Click to toggle auto-renew"
                        onClick={() => updateSubscription(sub.id, { autoRenew: !sub.autoRenew })}
                      >
                        {sub.autoRenew ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" title="Mark as renewed" onClick={() => renewSubscription(sub.id)}>
                          <RefreshCw size={18} />
                        </button>
                        <button className="icon-btn" title="Edit" onClick={() => openEdit(sub)}>
                          <Pencil size={18} />
                        </button>
                        <button className="icon-btn" title="Delete" onClick={() => handleDelete(sub)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* The same modal is used for adding and editing */}
      <Modal isOpen={modalOpen} title={editingSub ? 'Edit subscription' : 'Add subscription'} onClose={closeModal}>
        <ItemForm
          fields={subscriptionFields}
          initialValues={editingSub}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitLabel={editingSub ? 'Save changes' : 'Add subscription'}
        />
      </Modal>
    </>
  )
}