import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Minus, Sparkles, ChevronRight, Lightbulb, CheckCircle2, AlertTriangle,
  Info, Wallet, ListChecks,
} from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { KIND_ICONS, KIND_TONES } from '../../utils/display'
import {
  spendingInsight, upcomingWeek, productivityInsight, financialInsight, buildRecommendations,
} from '../../utils/insights'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const REC_ICONS = { danger: AlertTriangle, warning: AlertTriangle, info: Info }

// ----- Spending: the highlighted card (brand gradient) -----
function SpendingCard({ data }) {
  const { state, current, previous, percent, lastMonth, thisMonth } = data
  const Trend = state === 'up' ? TrendingUp : state === 'down' ? TrendingDown : Minus

  let message
  if (state === 'none') message = 'No payments recorded yet. Mark a bill as paid and you will see how this month compares with the last.'
  else if (state === 'first') message = `Nothing was paid in ${lastMonth}, so there is no earlier month to compare with yet.`
  else if (state === 'same') message = `About the same as ${lastMonth} (${formatCurrency(previous)}).`
  else if (state === 'up') message = `${Math.round(percent)}% more than the ${formatCurrency(previous)} paid in ${lastMonth}.`
  else message = `${Math.round(Math.abs(percent))}% less than the ${formatCurrency(previous)} paid in ${lastMonth}, with the month still in progress.`

  return (
    <article className="insight-card featured">
      <header className="insight-top">
        <span className="insight-icon"><Wallet size={18} /></span>
        <h3>Spending in {thisMonth}</h3>
      </header>
      <div className="insight-figure">{formatCurrency(current)}</div>
      {(state === 'up' || state === 'down' || state === 'same') && (
        <span className={`trend-pill ${state}`}>
          <Trend size={14} />
          {state === 'same' ? 'No change' : `${state === 'up' ? '+' : '-'}${Math.round(Math.abs(percent))}% vs ${lastMonth}`}
        </span>
      )}
      <p className="insight-text">{message}</p>
    </article>
  )
}

// ----- Productivity -----
function ProductivityCard({ data }) {
  const { total, completed, percent, doneThisWeek, dueNextWeek, overdue } = data
  return (
    <article className="insight-card">
      <header className="insight-top">
        <span className="insight-icon tone-primary"><ListChecks size={18} /></span>
        <h3>Productivity</h3>
      </header>
      {total === 0 ? (
        <p className="insight-empty">Add tasks to track how much you get done each week.</p>
      ) : (
        <>
          <div className="insight-figure">
            {percent}%<span className="insight-figure-note">{completed} of {total} tasks done</span>
          </div>
          <div className="progress" role="progressbar" aria-label="Task completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="progress-fill" style={{ '--p': percent / 100 }} />
          </div>
          <p className="insight-text">
            {doneThisWeek > 0
              ? `You completed ${plural(doneThisWeek, 'task')} in the last 7 days.`
              : 'No tasks completed in the last 7 days.'}
          </p>
          <dl className="mini-stats">
            <div><dt>Due next 7 days</dt><dd>{dueNextWeek}</dd></div>
            <div><dt>Overdue</dt><dd className={overdue > 0 ? 'bad' : ''}>{overdue}</dd></div>
          </dl>
        </>
      )}
    </article>
  )
}

// ----- Financial overview (amounts; the Payment status chart shows counts) -----
function FinancialCard({ data }) {
  const rows = [
    { key: 'paid', label: 'Paid', color: 'var(--success)', ...data.paid },
    { key: 'pending', label: 'Pending', color: 'var(--warning)', ...data.pending },
    { key: 'overdue', label: 'Overdue', color: 'var(--danger)', ...data.overdue },
  ]
  return (
    <article className="insight-card">
      <header className="insight-top">
        <span className="insight-icon tone-primary"><Wallet size={18} /></span>
        <h3>Financial overview</h3>
      </header>
      {!data.hasBills ? (
        <p className="insight-empty">Add a bill to see what you have paid and what is still outstanding.</p>
      ) : (
        <>
          <div className="insight-figure">
            {formatCurrency(data.outstanding)}
            <span className="insight-figure-note">still to pay</span>
          </div>
          <ul className="money-rows">
            {rows.map((r) => (
              <li key={r.key}>
                <span className="legend-dot" style={{ background: r.color }} />
                <span className="money-label">{r.label}<small>{plural(r.count, 'bill')}</small></span>
                <span className="money-amount">{formatCurrency(r.amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}

// ----- Upcoming responsibilities (next 7 days) -----
function UpcomingCard({ items, overdue }) {
  return (
    <section className="insight-card insight-wide">
      <header className="insight-top">
        <span className="insight-icon tone-primary"><Sparkles size={18} /></span>
        <div className="insight-top-text">
          <h3>Coming up in the next 7 days</h3>
        </div>
        <Link to="/reminders" className="insight-link">All reminders</Link>
      </header>

      {items.length === 0 ? (
        <p className="insight-empty">Nothing is due in the next 7 days.</p>
      ) : (
        <ul className="upcoming-list">
          {items.slice(0, 6).map((r) => {
            const Icon = KIND_ICONS[r.kind]
            return (
              <li key={r.id}>
                <Link to={r.path} className="upcoming-row">
                  <span className={`list-icon tone-${KIND_TONES[r.kind]}`}><Icon size={18} /></span>
                  <span className="list-main">
                    <strong>{r.title}</strong>
                    <span className="muted">{[r.label, r.detail].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="upcoming-when">
                    <span>{r.when}</span>
                    <span className="muted">{formatDate(r.date)}</span>
                  </span>
                  <span className="priority-slot"><StatusBadge status={r.priority} /></span>
                  <ChevronRight size={16} className="row-chevron" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {(items.length > 6 || overdue.length > 0) && (
        <p className="insight-foot">
          {items.length > 6 && `${items.length - 6} more this week. `}
          {overdue.length > 0 && (
            <Link to="/reminders" className="bad">
              {plural(overdue.length, 'item')} overdue
            </Link>
          )}
        </p>
      )}
    </section>
  )
}

// ----- Smart recommendations -----
function Recommendations({ recs, hasAnyData }) {
  return (
    <section className="insight-card">
      <header className="insight-top">
        <span className="insight-icon tone-primary"><Lightbulb size={18} /></span>
        <h3>Smart recommendations</h3>
      </header>
      {recs.length === 0 ? (
        <div className="insight-empty">
          {hasAnyData ? (
            <>
              <CheckCircle2 size={20} className="ok" aria-hidden="true" />
              <p>You are all caught up. Nothing needs your attention right now.</p>
            </>
          ) : (
            <p>Add bills, tasks or documents and LifeSync will suggest what to do next.</p>
          )}
        </div>
      ) : (
        <ul className="rec-list">
          {recs.map((r) => {
            const Icon = REC_ICONS[r.tone]
            return (
              <li key={r.id}>
                <Link to={r.path} className="rec-row">
                  <span className={`list-icon tone-${r.tone}`}><Icon size={18} /></span>
                  <span className="list-main">
                    <strong>{r.title}</strong>
                    <span className="muted">{r.text}</span>
                  </span>
                  <ChevronRight size={16} className="row-chevron" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// The Smart Insights section. All numbers are recalculated from Context data on every change.
export default function SmartInsights({ bills, documents, subscriptions, tasks, appointments, snoozes }) {
  const data = { bills, documents, subscriptions, tasks, appointments }
  const spending = spendingInsight(bills)
  const upcoming = upcomingWeek(data, snoozes)
  const productivity = productivityInsight(tasks)
  const financial = financialInsight(bills)
  const recs = buildRecommendations(data, spending)
  const hasAnyData = bills.length + tasks.length + documents.length + subscriptions.length + appointments.length > 0

  return (
    <section className="insights" aria-labelledby="insights-title">
      <div className="insights-head">
        <h2 id="insights-title">Smart insights</h2>
        <p className="muted">Worked out from your bills, tasks, documents and subscriptions.</p>
      </div>
      <div className="insight-grid">
        <SpendingCard data={spending} />
        <ProductivityCard data={productivity} />
        <FinancialCard data={financial} />
        <UpcomingCard items={upcoming.items} overdue={upcoming.overdue} />
        <Recommendations recs={recs} hasAnyData={hasAnyData} />
      </div>
    </section>
  )
}
