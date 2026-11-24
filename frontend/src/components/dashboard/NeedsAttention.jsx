import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Receipt } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Tabs, { tabPanelProps } from '../common/Tabs'
import { formatDate } from '../../utils/helpers'
import { buildAttentionLists, onlyBills } from '../../utils/attention'
import useToday from '../../hooks/useToday'
import { KIND_PATHS } from '../../utils/insights'
import { KIND_ICONS, KIND_TONES, dueStatus, relativeDays } from '../../utils/display'
import useReminderActions, { DONE_LABEL } from '../../hooks/useReminderActions'

const COLLAPSED_COUNT = 6

const TAB_DEFS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Next 7 days' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'all', label: 'All' },
]

const EMPTY_TEXT = {
  today: 'Nothing is due today.',
  week: 'Nothing is due in the next 7 days.',
  overdue: 'Nothing is overdue. Nice work!',
  all: 'Nothing needs your attention right now.',
}

// Opens the exact item on its own page (the page highlights it and moves focus to it).
function itemPath(r) {
  const base = `${KIND_PATHS[r.kind]}?focus=${encodeURIComponent(r.sourceId)}`
  return r.kind === 'appointment' ? `${base}&tab=appointments` : base
}

// One panel for everything that needs the user: today's tasks, appointments and bills, the next
// week, and anything overdue. It is built from the same reminders as the Reminders page, so
// snoozed and completed items are left out and each item appears once.
export default function NeedsAttention({ bills, documents, subscriptions, tasks, appointments, snoozes }) {
  const [tab, setTab] = useState('today')
  const [billsOnly, setBillsOnly] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { markDone, snooze } = useReminderActions()

  // `today` changes at midnight, which rebuilds the lists so "Today" is never yesterday's items.
  const today = useToday()
  const lists = useMemo(
    () => buildAttentionLists({ bills, documents, subscriptions, tasks, appointments }, snoozes),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `today` is only here to rebuild the lists at midnight
    [bills, documents, subscriptions, tasks, appointments, snoozes, today]
  )

  const visible = (key) => (billsOnly ? onlyBills(lists[key]) : lists[key])
  const list = visible(tab)
  const shown = expanded ? list : list.slice(0, COLLAPSED_COUNT)
  const hidden = list.length - shown.length

  return (
    <section className="panel attention" aria-labelledby="attention-title">
      <div className="panel-header">
        <h2 id="attention-title">Needs attention</h2>
        <Link to="/reminders">All reminders</Link>
      </div>

      <div className="attention-toolbar">
        <div className="scroll-tabs">
          <Tabs
            id="attention-tabs"
            label="Needs attention filters"
            tabs={TAB_DEFS.map((t) => ({ key: t.key, label: `${t.label} (${visible(t.key).length})` }))}
            value={tab}
            onChange={(key) => { setTab(key); setExpanded(false) }}
          />
        </div>
        <button
          type="button"
          className={`chip chip-icon${billsOnly ? ' active' : ''}`}
          aria-pressed={billsOnly}
          onClick={() => { setBillsOnly((v) => !v); setExpanded(false) }}
        >
          <Receipt size={14} aria-hidden="true" />
          Bills
        </button>
      </div>

      <div {...tabPanelProps('attention-tabs', tab)}>
        {list.length === 0 ? (
          <p className="muted panel-empty">{billsOnly ? `No bills here. ${EMPTY_TEXT[tab]}` : EMPTY_TEXT[tab]}</p>
        ) : (
          <ul className="attention-list">
            {shown.map((r) => {
              const Icon = KIND_ICONS[r.kind]
              return (
                <li key={r.id} className="list-row attention-row">
                  <Link to={itemPath(r)} className="attention-link">
                    <span className={`list-icon tone-${KIND_TONES[r.kind]}`}><Icon size={18} /></span>
                    <span className="list-main">
                      <strong>{r.title}</strong>
                      <span className="muted">{r.label}{r.detail ? ` · ${r.detail}` : ''}</span>
                    </span>
                    <span className="list-side">
                      <span>{formatDate(r.date)}</span>
                      <StatusBadge status={dueStatus(r.date, false)} />
                      <span className="muted">{relativeDays(r.date)}</span>
                    </span>
                    <ChevronRight size={16} className="row-chevron" aria-hidden="true" />
                  </Link>
                  <div className="reminder-actions">
                    {r.kind !== 'document' && (
                      <button
                        type="button"
                        className="btn-primary btn-small"
                        aria-label={`${DONE_LABEL[r.kind]}: ${r.title}`}
                        onClick={() => markDone(r)}
                      >
                        {DONE_LABEL[r.kind]}
                      </button>
                    )}
                    <select
                      className="filter-select btn-small"
                      aria-label={`Snooze duration for ${r.title}`}
                      value=""
                      onChange={(e) => e.target.value && snooze(r, Number(e.target.value))}
                    >
                      <option value="">Snooze</option>
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">1 week</option>
                      <option value="30">1 month</option>
                    </select>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {list.length > COLLAPSED_COUNT && (
          <button
            type="button"
            className="btn-secondary btn-small attention-more"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show fewer' : `Show ${hidden} more`}
          </button>
        )}
      </div>
    </section>
  )
}
