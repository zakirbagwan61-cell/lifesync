import { useState } from 'react'
import {
  Plus, Pencil, Trash2, FileText, Fingerprint, CreditCard, Plane, Car, Shield,
  CheckCircle, Clock, AlertTriangle, AlertCircle,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ItemForm from '../components/common/ItemForm'
import { formatDate, daysUntil } from '../utils/helpers'
import { DOC_ALERT_DAYS } from '../utils/reminders'

import { DOC_TYPES, documentFields } from '../utils/fields'
import { useConfirm } from '../context/ConfirmContext'
import useFocusItem from '../hooks/useFocusItem'

// One icon per document type.
const TYPE_ICONS = {
  Aadhaar: Fingerprint,
  PAN: CreditCard,
  Passport: Plane,
  'Driving Licence': Car,
  Insurance: Shield,
  Other: FileText,
}

// A document counts as "expiring soon" when it expires within this many days.



// 'expired' | 'expiring' | 'valid' | null (null = no expiry date)
function getExpiryStatus(doc) {
  if (!doc.expiryDate) return null
  const days = daysUntil(doc.expiryDate)
  if (days < 0) return 'expired'
  if (days <= DOC_ALERT_DAYS) return 'expiring'
  return 'valid'
}

// Human-friendly text such as "Expires in 45 days".
function expiryText(doc) {
  if (!doc.expiryDate) return 'No expiry'
  const days = daysUntil(doc.expiryDate)
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
  if (days === 0) return 'Expires today'
  return `Expires in ${days} day${days === 1 ? '' : 's'}`
}

export default function Documents() {
  const { documents, addDocument, updateDocument, deleteDocument } = useApp()
    const confirm = useConfirm()

  const [typeFilter, setTypeFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null) // null = adding a new document

  // Opened from a link such as Search or Reminders ("/documents?focus=<id>"): clear the filter and highlight that card.
  useFocusItem(() => setTypeFilter('All'))

  // ----- Numbers for the stat cards and alert banner -----
  const expiredCount = documents.filter((d) => getExpiryStatus(d) === 'expired').length
  const expiringCount = documents.filter((d) => getExpiryStatus(d) === 'expiring').length
  const validCount = documents.length - expiredCount - expiringCount
  const needAttention = expiredCount + expiringCount

  // ----- The list to show: filter by type, soonest expiry first, no-expiry last -----
  const visible = documents
    .filter((d) => typeFilter === 'All' || d.type === typeFilter)
    .sort((a, b) =>
      (a.expiryDate || '9999-12-31').localeCompare(b.expiryDate || '9999-12-31')
    )

  const openAdd = () => {
    setEditingDoc(null)
    setModalOpen(true)
  }
  const openEdit = (doc) => {
    setEditingDoc(doc)
    setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)

  const handleSubmit = (values) => {
    if (editingDoc) updateDocument(editingDoc.id, values)
    else addDocument(values)
    closeModal()
  }

    const handleDelete = async (doc) => {
    const ok = await confirm({ title: 'Delete document', message: `Delete ${doc.type} (${doc.holder})? This cannot be undone.` })
    if (ok) deleteDocument(doc.id)
  }

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Keep important documents and their expiry dates in one place."
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add document
          </button>
        }
      />

      {/* Alert banner: only shown when something needs attention */}
      {needAttention > 0 && (
        <div className="alert-banner">
          <AlertCircle size={20} />
          <span>
            {needAttention} document{needAttention === 1 ? '' : 's'} need attention:{' '}
            {expiredCount} expired, {expiringCount} expiring within {DOC_ALERT_DAYS} days.
          </span>
        </div>
      )}

      <div className="stat-grid">
        <StatCard label="Total documents" value={documents.length} icon={FileText} tone="primary" />
        <StatCard label="Valid" value={validCount} icon={CheckCircle} tone="success" />
        <StatCard label="Expiring soon" value={expiringCount} icon={Clock} tone="warning" />
        <StatCard label="Expired" value={expiredCount} icon={AlertTriangle} tone="danger" />
      </div>

      <div className="toolbar">
        <select className="filter-select" aria-label="Filter by document type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All types</option>
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents here"
          message="Add a document to track its details and expiry date."
          action={
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={18} /> Add document
            </button>
          }
        />
      ) : (
        <div className="doc-grid">
          {visible.map((doc) => {
            const Icon = TYPE_ICONS[doc.type] || FileText
            const status = getExpiryStatus(doc)
            return (
              <div key={doc.id} className="doc-card" data-item-id={doc.id}>
                <div className="doc-card-top">
                  <div className="stat-icon tone-primary">
                    <Icon size={22} />
                  </div>
                  <div className="doc-card-title">
                    <strong>{doc.type}</strong>
                    <div className="muted">{doc.holder}</div>
                  </div>
                  {status && <StatusBadge status={status} />}
                </div>

                <div className="doc-number">{doc.number}</div>

                <div className="doc-meta">
                  <div>
                    <span className="muted">Issued</span>
                    <div>{formatDate(doc.issueDate)}</div>
                  </div>
                  <div>
                    <span className="muted">Expires</span>
                    <div>{doc.expiryDate ? formatDate(doc.expiryDate) : 'Never'}</div>
                  </div>
                </div>

                <div className="muted">{expiryText(doc)}</div>
                {doc.notes && <div className="doc-notes">{doc.notes}</div>}

                <div className="row-actions">
                  <button className="icon-btn" title="Edit" aria-label={`Edit ${doc.type} (${doc.holder})`} onClick={() => openEdit(doc)}>
                    <Pencil size={18} />
                  </button>
                  <button className="icon-btn" title="Delete" aria-label={`Delete ${doc.type} (${doc.holder})`} onClick={() => handleDelete(doc)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* The same modal is used for adding and editing */}
      <Modal isOpen={modalOpen} title={editingDoc ? 'Edit document' : 'Add document'} onClose={closeModal}>
        <ItemForm
          fields={documentFields}
          initialValues={editingDoc}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitLabel={editingDoc ? 'Save changes' : 'Add document'}
        />
      </Modal>
    </>
  )
}