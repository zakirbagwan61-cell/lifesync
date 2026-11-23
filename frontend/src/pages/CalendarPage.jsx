import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import { formatDate, todayString, addDays, addMonths } from '../utils/helpers'
import { buildReminders } from '../utils/reminders'
import { KIND_ICONS, KIND_TONES, dueStatus } from '../utils/display'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Dot / chip color for each kind of event.
const KIND_COLORS = {
  bill: 'var(--warning)',
  document: 'var(--primary)',
  subscription: 'var(--text-muted)',
  task: 'var(--success)',
  appointment: 'var(--info)',
}
const KIND_NAMES = {
  bill: 'Bills',
  document: 'Document expiry',
  subscription: 'Renewals',
  task: 'Tasks',
  appointment: 'Appointments',
}

// The Monday of the week that contains `dateString`.
function startOfWeek(dateString) {
  const [y, m, d] = dateString.split('-').map(Number)
  const daysSinceMonday = (new Date(y, m - 1, d).getDay() + 6) % 7
  return addDays(dateString, -daysSinceMonday)
}

export default function CalendarPage() {
  const { bills, documents, subscriptions, tasks, appointments } = useApp()
  const today = todayString()

  const [view, setView] = useState('month') // 'month' | 'week'
  const [cursor, setCursor] = useState(today) // any date inside the period being shown
  const [selected, setSelected] = useState(today) // the day whose events are listed below

  // Every dated item from every module, grouped by its date: { '2026-11-20': [event, ...] }
  const eventsByDate = {}
  buildReminders({ bills, documents, subscriptions, tasks, appointments }).forEach((e) => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  })

  // ----- Work out which days to draw -----
  const monthKey = cursor.slice(0, 7) // "2026-11"
  const [year, month] = monthKey.split('-').map(Number)

  let days
  if (view === 'month') {
    const daysInMonth = new Date(year, month, 0).getDate()
    const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7 // blank cells before the 1st
    const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7
    const gridStart = startOfWeek(`${monthKey}-01`)
    days = Array.from({ length: cellCount }, (_, i) => addDays(gridStart, i))
  } else {
    const weekStart = startOfWeek(cursor)
    days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }

  const title =
    view === 'month'
      ? new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : `${formatDate(days[0])} - ${formatDate(days[6])}`

  // ----- Navigation -----
  const goPrev = () => setCursor(view === 'month' ? addMonths(`${monthKey}-01`, -1) : addDays(cursor, -7))
  const goNext = () => setCursor(view === 'month' ? addMonths(`${monthKey}-01`, 1) : addDays(cursor, 7))
  const goToday = () => {
    setCursor(today)
    setSelected(today)
  }

  const selectDay = (date) => {
    setSelected(date)
    if (view === 'month' && date.slice(0, 7) !== monthKey) setCursor(date) // clicked a day from another month
  }

  const selectedEvents = eventsByDate[selected] || []

  return (
    <>
      <PageHeader title="Calendar" subtitle="Bills, tasks, appointments and renewals by date." />

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="icon-btn" onClick={goPrev} aria-label="Previous"><ChevronLeft size={22} /></button>
          <div className="cal-title">{title}</div>
          <button className="icon-btn" onClick={goNext} aria-label="Next"><ChevronRight size={22} /></button>
          <button className="btn-secondary btn-small" onClick={goToday}>Today</button>
        </div>

        <div className="tabs">
          <button className={`tab ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>Month</button>
          <button className={`tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>Week</button>
        </div>
      </div>

      {/* Legend: what each color means */}
      <div className="cal-legend">
        {Object.keys(KIND_NAMES).map((k) => (
          <span key={k}>
            <span className="dot" style={{ background: KIND_COLORS[k] }} /> {KIND_NAMES[k]}
          </span>
        ))}
      </div>

      {view === 'month' ? (
        <div className="cal-grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal-weekday">{d}</div>
          ))}

          {days.map((date) => {
            const events = eventsByDate[date] || []
            const classes = [
              'cal-day',
              date.slice(0, 7) !== monthKey ? 'other-month' : '',
              date === today ? 'today' : '',
              date === selected ? 'selected' : '',
            ].join(' ')
            return (
              <button key={date} className={classes} onClick={() => selectDay(date)}>
                <span className="cal-day-num">{Number(date.slice(8))}</span>
                <span className="cal-dots">
                  {events.slice(0, 4).map((e) => (
                    <span key={e.id} className="dot" style={{ background: KIND_COLORS[e.kind] }} />
                  ))}
                  {events.length > 4 && <span className="cal-more">+{events.length - 4}</span>}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="week-grid">
          {days.map((date, i) => {
            const events = eventsByDate[date] || []
            return (
              <button
                key={date}
                className={`week-col ${date === today ? 'today' : ''} ${date === selected ? 'selected' : ''}`}
                onClick={() => selectDay(date)}
              >
                <div className="week-head">
                  {WEEKDAYS[i]} <strong>{Number(date.slice(8))}</strong>
                </div>
                {events.length === 0 && <span className="muted">-</span>}
                {events.map((e) => (
                  <span
                    key={e.id}
                    className={`week-chip ${e.completed ? 'done-chip' : ''}`}
                    style={{ borderLeftColor: KIND_COLORS[e.kind] }}
                  >
                    {e.title}
                  </span>
                ))}
              </button>
            )
          })}
        </div>
      )}

      {/* Events of the selected day */}
      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{selected === today ? 'Today' : formatDate(selected)}</h2>
          <span className="muted">
            {selectedEvents.length} event{selectedEvents.length === 1 ? '' : 's'}
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="muted panel-empty">Nothing scheduled for this day.</p>
        ) : (
          selectedEvents.map((e) => {
            const Icon = KIND_ICONS[e.kind]
            return (
              <div key={e.id} className="list-row">
                <div className={`list-icon tone-${KIND_TONES[e.kind]}`}>
                  <Icon size={18} />
                </div>
                <div className="list-main">
                  <strong>{e.title}</strong>
                  <span className="muted">
                    {e.label}
                    {e.detail ? ` · ${e.detail}` : ''}
                  </span>
                </div>
                <div className="list-side">
                  <StatusBadge status={dueStatus(e.date, e.completed)} />
                </div>
              </div>
            )
          })
        )}
      </section>
    </>
  )
}