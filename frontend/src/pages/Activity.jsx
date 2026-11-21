import { useState } from 'react'
import { History, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import { KIND_ICONS, KIND_TONES, describeActivity, formatDateTime } from '../utils/display'
import { useConfirm } from '../context/ConfirmContext'

const TYPES = ['bill', 'document', 'subscription', 'task', 'appointment']

export default function Activity() {
  const { activity, clearActivity } = useApp()
  const confirm = useConfirm()
  const [typeFilter, setTypeFilter] = useState('All')

  // The log is already newest-first; we only filter it.
  const visible = activity.filter((e) => typeFilter === 'All' || e.type === typeFilter)

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
        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
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
          title="No activity yet"
          message="Adding, editing, paying or completing items will show up here."
        />
      ) : (
        <div className="panel">
          {visible.map((entry) => {
            const Icon = KIND_ICONS[entry.type] || History
            return (
              <div key={entry.id} className="list-row">
                <div className={`list-icon tone-${KIND_TONES[entry.type] || 'neutral'}`}>
                  <Icon size={18} />
                </div>
                <div className="list-main">
                  <strong>{describeActivity(entry)}</strong>
                </div>
                <div className="list-side muted">{formatDateTime(entry.timestamp)}</div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}