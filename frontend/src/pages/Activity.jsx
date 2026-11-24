import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, History, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import { KIND_ICONS, KIND_TONES, describeActivity } from '../utils/display'
import { MAX_ACTIVITY, activityLink, groupActivityByDay } from '../utils/activity'
import { useConfirm } from '../context/ConfirmContext'

const TYPES = ['bill', 'document', 'subscription', 'task', 'appointment']

// "3:05 pm" from an ISO timestamp
const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

export default function Activity() {
  const { activity, clearActivity, bills, documents, subscriptions, tasks, appointments } = useApp()
  const confirm = useConfirm()
  const [typeFilter, setTypeFilter] = useState('All')

  // The log is already newest-first; we only filter it and group it by day.
  const visible = activity.filter((e) => typeFilter === 'All' || e.type === typeFilter)
  const groups = groupActivityByDay(visible)
  const data = { bills, documents, subscriptions, tasks, appointments }

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Clear history',
      message: 'Clear all activity history? This cannot be undone.',
      confirmLabel: 'Clear',
    })
    if (ok) clearActivity()
  }

  return (
    <>
      <PageHeader
        title="Activity History"
        subtitle="A record of completed payments, tasks and changes."
        action={
          activity.length > 0 && (
            <button className="btn-danger" onClick={handleClear}>
              <Trash2 size={16} /> Clear history
            </button>
          )
        }
      />

      <div className="toolbar">
        <select className="filter-select" aria-label="Filter by activity type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All activity</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}s
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={History}
          title={activity.length === 0 ? 'No activity yet' : 'No matching activity'}
          message={activity.length === 0 ? 'Adding, editing, paying or completing items will show up here.' : 'Try another activity type.'}
        />
      ) : (
        groups.map((group) => (
          <section key={group.key || 'earlier'} className="activity-group" aria-labelledby={`activity-${group.key || 'earlier'}`}>
            <h2 className="activity-day" id={`activity-${group.key || 'earlier'}`}>{group.label}</h2>
            <div className="panel">
              {group.entries.map((entry) => {
                const Icon = KIND_ICONS[entry.type] || History
                const path = activityLink(entry, data)
                const content = (
                  <>
                    <div className={`list-icon tone-${KIND_TONES[entry.type] || 'neutral'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="list-main">
                      <strong>{describeActivity(entry)}</strong>
                    </div>
                    <div className="list-side muted">{timeOf(entry.timestamp)}</div>
                  </>
                )
                return (
                  <div key={entry.id} className="list-row">
                    {path ? (
                      <Link to={path} className="attention-link" aria-label={`Open: ${describeActivity(entry)}`}>
                        {content}
                        <ChevronRight size={16} className="row-chevron" aria-hidden="true" />
                      </Link>
                    ) : (
                      content
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}

      {activity.length >= MAX_ACTIVITY && (
        <p className="muted tab-hint">
          Showing the latest {MAX_ACTIVITY} changes. Older entries are removed automatically to keep LifeSync fast.
        </p>
      )}
    </>
  )
}
