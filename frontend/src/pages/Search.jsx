import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import { formatCurrency, formatDate } from '../utils/helpers'
import { formatTime, dueStatus, KIND_ICONS, KIND_TONES } from '../utils/display'

// Which page "Open" goes to, and the name shown in the filter.
const KIND_PATHS = {
  bill: '/bills',
  document: '/documents',
  subscription: '/subscriptions',
  task: '/tasks',
  appointment: '/tasks',
}
const KIND_LABELS = {
  bill: 'Bills',
  document: 'Documents',
  subscription: 'Subscriptions',
  task: 'Tasks',
  appointment: 'Appointments',
}

export default function Search() {
  const { bills, documents, subscriptions, tasks, appointments } = useApp()
  const [params] = useSearchParams() // reads ?q=... from the address bar
  const [kindFilter, setKindFilter] = useState('All')

  const query = (params.get('q') || '').trim()

  // Turn every item from every module into one searchable list.
  // `text` is all the words we search inside, in lowercase.
  const items = [
    ...bills.map((b) => ({
      id: `bill-${b.id}`, kind: 'bill', title: b.title,
      meta: `${b.category} · ${formatCurrency(b.amount)}`,
      date: b.dueDate, completed: b.status === 'paid',
      text: [b.title, b.category, b.amount].join(' ').toLowerCase(),
    })),
    ...documents.map((d) => ({
      id: `document-${d.id}`, kind: 'document', title: `${d.type} (${d.holder})`,
      meta: d.number, date: d.expiryDate, completed: false,
      text: [d.type, d.holder, d.number, d.notes].join(' ').toLowerCase(),
    })),
    ...subscriptions.map((s) => ({
      id: `subscription-${s.id}`, kind: 'subscription', title: s.name,
      meta: `${formatCurrency(s.cost)} / ${s.cycle === 'Yearly' ? 'year' : 'month'}`,
      date: s.nextRenewal, completed: false,
      text: [s.name, s.cycle, s.cost].join(' ').toLowerCase(),
    })),
    ...tasks.map((t) => ({
      id: `task-${t.id}`, kind: 'task', title: t.title,
      meta: `${t.priority} priority`, date: t.deadline, completed: t.completed,
      text: [t.title, t.priority].join(' ').toLowerCase(),
    })),
    ...appointments.map((a) => ({
      id: `appointment-${a.id}`, kind: 'appointment', title: a.title,
      meta: [formatTime(a.time), a.location].filter(Boolean).join(' · '),
      date: a.date, completed: a.completed,
      text: [a.title, a.location].join(' ').toLowerCase(),
    })),
  ]

  const results = query ? items.filter((i) => i.text.includes(query.toLowerCase())) : []
  const shown = results
    .filter((r) => kindFilter === 'All' || r.kind === kindFilter)
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))

  return (
    <>
      <PageHeader
        title="Search"
        subtitle={query ? `${results.length} result${results.length === 1 ? '' : 's'} for "${query}"` : 'Results from across all modules.'}
      />

      {query && (
        <div className="toolbar">
          <select className="filter-select" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="All">All types ({results.length})</option>
            {Object.keys(KIND_LABELS).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]} ({results.filter((r) => r.kind === k).length})
              </option>
            ))}
          </select>
        </div>
      )}

      {!query ? (
        <EmptyState
          icon={SearchIcon}
          title="Search everything"
          message="Type in the search box at the top and press Enter."
        />
      ) : shown.length === 0 ? (
        <EmptyState icon={SearchIcon} title="No results" message="Try a different word or change the filter." />
      ) : (
        <div className="panel">
          {shown.map((r) => {
            const Icon = KIND_ICONS[r.kind]
            return (
              <div key={r.id} className="list-row">
                <div className={`list-icon tone-${KIND_TONES[r.kind]}`}>
                  <Icon size={18} />
                </div>
                <div className="list-main">
                  <strong>{r.title}</strong>
                  <span className="muted">
                    {KIND_LABELS[r.kind]}
                    {r.meta ? ` · ${r.meta}` : ''}
                  </span>
                </div>
                <div className="list-side">
                  {r.date && <div>{formatDate(r.date)}</div>}
                  {r.date && <StatusBadge status={dueStatus(r.date, r.completed)} />}
                </div>
                <Link to={KIND_PATHS[r.kind]} className="btn-secondary btn-small">Open</Link>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}