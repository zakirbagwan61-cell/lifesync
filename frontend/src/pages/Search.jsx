import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import { formatDate } from '../utils/helpers'
import { dueStatus, KIND_ICONS, KIND_TONES } from '../utils/display'
import { KIND_PATHS } from '../utils/insights'
import { buildSearchItems, filterSearchItems, sortSearchResults } from '../utils/search'

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

  // A new search starts with every type shown again
  useEffect(() => setKindFilter('All'), [query])

  const items = buildSearchItems({ bills, documents, subscriptions, tasks, appointments })
  const results = filterSearchItems(items, query)
  const shown = sortSearchResults(results.filter((r) => kindFilter === 'All' || r.kind === kindFilter))

  return (
    <>
      <PageHeader
        title="Search"
        subtitle={query ? `${results.length} result${results.length === 1 ? '' : 's'} for "${query}"` : 'Results from across all modules.'}
      />

      {query && (
        <div className="toolbar">
          <select className="filter-select" aria-label="Filter results by type" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
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
                <Link to={`${KIND_PATHS[r.kind]}?focus=${r.sourceId}`} className="btn-secondary btn-small" aria-label={`Open ${r.title}`}>Open</Link>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}