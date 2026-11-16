import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import { formatDate } from '../utils/helpers'
import { buildReminders, groupReminders } from '../utils/reminders'
import { KIND_ICONS, KIND_TONES, dueStatus, relativeDays } from '../utils/display'

const TABS = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'snoozed', label: 'Snoozed' },
  { key: 'completed', label: 'Completed' },
]

// Text of the main action button for each kind of reminder.
const DONE_LABEL = {
  bill: 'Mark paid',
  task: 'Mark done',
  appointment: 'Mark done',
  subscription: 'Mark renewed',
}

export default function Reminders() {
  const {
    bills, documents, subscriptions, tasks, appointments, snoozes,
    snoozeReminder, unsnoozeReminder,
    markBillPaid, toggleTask, toggleAppointment, renewSubscription,
  } = useApp()

  const [tab, setTab] = useState('upcoming')

  // Reminders are calculated from the other modules, never stored.
  const groups = groupReminders(
    buildReminders({ bills, documents, subscriptions, tasks, appointments }),
    snoozes
  )
  const list = tab === 'completed' ? groups.completed.slice(0, 50) : groups[tab]

  // Run the right action in the right module when the user finishes a reminder.
  const markDone = (r) => {
    if (r.kind === 'bill') markBillPaid(r.sourceId)
    else if (r.kind === 'task') toggleTask(r.sourceId)
    else if (r.kind === 'appointment') toggleAppointment(r.sourceId)
    else if (r.kind === 'subscription') renewSubscription(r.sourceId)
  }

  return (
    <>
      <PageHeader
        title="Reminders"
        subtitle="Alerts for bills, subscriptions, documents, tasks and appointments."
      />

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} ({groups[t.key].length})
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={tab === 'snoozed' ? BellOff : Bell}
          title={`No ${tab} reminders`}
          message={tab === 'overdue' ? 'Nothing is overdue. Nice work!' : 'Reminders will appear here automatically.'}
        />
      ) : (
        <div className="panel">
          {list.map((r) => {
            const Icon = KIND_ICONS[r.kind]
            return (
              <div key={r.id} className="list-row reminder-row">
                <div className={`list-icon tone-${KIND_TONES[r.kind]}`}>
                  <Icon size={18} />
                </div>

                <div className="list-main">
                  <strong>{r.title}</strong>
                  <span className="muted">
                    {r.label}
                    {r.detail ? ` · ${r.detail}` : ''}
                  </span>
                </div>

                <div className="list-side">
                  <div>{formatDate(r.date)}</div>
                  {r.completed ? (
                    <StatusBadge status="completed" />
                  ) : (
                    <>
                      <StatusBadge status={dueStatus(r.date, false)} />
                      <div className="muted">{relativeDays(r.date)}</div>
                    </>
                  )}
                </div>

                {/* Actions depend on the tab */}
                {tab === 'snoozed' && (
                  <div className="reminder-actions">
                    <span className="muted">Until {formatDate(r.snoozedUntil)}</span>
                    <button className="btn-secondary btn-small" onClick={() => unsnoozeReminder(r.id)}>
                      Unsnooze
                    </button>
                  </div>
                )}

                {(tab === 'overdue' || tab === 'upcoming') && (
                  <div className="reminder-actions">
                    {r.kind === 'document' ? (
                      <Link to="/documents" className="btn-secondary btn-small">View document</Link>
                    ) : (
                      <button className="btn-primary btn-small" onClick={() => markDone(r)}>
                        {DONE_LABEL[r.kind]}
                      </button>
                    )}

                    <select
                      className="filter-select btn-small"
                      value=""
                      onChange={(e) => e.target.value && snoozeReminder(r.id, Number(e.target.value))}
                    >
                      <option value="">Snooze</option>
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">1 week</option>
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}