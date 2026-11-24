import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Minus, ChevronRight, Lightbulb, CheckCircle2, AlertTriangle,
  Info, Wallet, ListChecks,
} from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const REC_ICONS = { danger: AlertTriangle, warning: AlertTriangle, info: Info }

// ----- Spending: this month vs last month (all three summary cards share the same plain style) -----
export function SpendingCard({ data }) {
  const { state, current, previous, percent, lastMonth, thisMonth } = data
  const Trend = state === 'up' ? TrendingUp : state === 'down' ? TrendingDown : Minus

  let message
  if (state === 'none') message = 'No payments recorded yet. Mark a bill as paid and you will see how this month compares with the last.'
  else if (state === 'first') message = `Nothing was paid in ${lastMonth}, so there is no earlier month to compare with yet.`
  else if (state === 'same') message = `About the same as ${lastMonth} (${formatCurrency(previous)}).`
  else if (state === 'up') message = `${Math.round(percent)}% more than the ${formatCurrency(previous)} paid in ${lastMonth}.`
  else message = `${Math.round(Math.abs(percent))}% less than the ${formatCurrency(previous)} paid in ${lastMonth}, with the month still in progress.`

  return (
    <article className="insight-card">
      <header className="insight-top">
        <span className="insight-icon tone-primary"><Wallet size={18} /></span>
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
export function ProductivityCard({ data }) {
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

// ----- Smart recommendations -----
export function Recommendations({ recs, hasAnyData }) {
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

