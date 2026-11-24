import { Link } from 'react-router-dom'
import { Clock, CheckSquare, IndianRupee, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import DashboardCharts from '../components/charts/DashboardCharts'
import NeedsAttention from '../components/dashboard/NeedsAttention'
import { SpendingCard, ProductivityCard, Recommendations } from '../components/insights/SmartInsights'
import { formatCurrency, formatDate, daysUntil } from '../utils/helpers'
import useToday from '../hooks/useToday'
import {
  spendingInsight, productivityInsight, financialInsight, buildRecommendations,
} from '../utils/insights'
import {
  KIND_ICONS, KIND_TONES, describeActivity, formatDateTime,
} from '../utils/display'

// A document shows up in the alerts when it expires within this many days (or already has).
const DOC_ALERT_DAYS = 60

// A card with a title and a "View all" link.
function Panel({ title, to, children }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        {to && <Link to={to}>View all</Link>}
      </div>
      {children}
    </section>
  )
}

// One line inside a panel: icon, title, small text, and something on the right.
function Row({ kind, title, meta, date, badge }) {
  const Icon = KIND_ICONS[kind]
  return (
    <div className="list-row">
      <div className={`list-icon tone-${KIND_TONES[kind]}`}>
        <Icon size={18} />
      </div>
      <div className="list-main">
        <strong>{title}</strong>
        {meta && <span className="muted">{meta}</span>}
      </div>
      <div className="list-side">
        {date && <div>{date}</div>}
        {badge}
      </div>
    </div>
  )
}

const Empty = ({ text }) => <p className="muted panel-empty">{text}</p>


export default function Dashboard() {
  const { userName, bills, documents, subscriptions, tasks, appointments, activity, snoozes } = useApp()
  const today = useToday() // re-renders at midnight so the day-based numbers stay correct

  // ----- Numbers for the stat cards -----
  const { outstanding } = financialInsight(bills)
  const pendingBillCount = bills.filter((b) => b.status !== 'paid').length
  const perMonth = subscriptions.reduce(
    (sum, s) => sum + (s.cycle === 'Yearly' ? s.cost / 12 : s.cost),
    0
  )
  const pendingTasks = tasks.filter((t) => !t.completed)
  const tasksToday = pendingTasks.filter((t) => t.deadline === today).length
  const tasksOverdue = pendingTasks.filter((t) => t.deadline < today).length

  // ----- Panel data -----
  const expiryAlerts = documents
    .filter((d) => d.expiryDate && daysUntil(d.expiryDate) <= DOC_ALERT_DAYS)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))

  const recentActivity = activity.slice(0, 6)

  // ----- Smart insights (all calculated in utils/insights.js) -----
  const data = { bills, documents, subscriptions, tasks, appointments }
  const spending = spendingInsight(bills)
  const productivity = productivityInsight(tasks)
  const recs = buildRecommendations(data, spending)
  const hasAnyData = bills.length + tasks.length + documents.length + subscriptions.length + appointments.length > 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <PageHeader
        title={`${greeting}, ${userName}`}
        subtitle={new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />

      <div className="stat-grid stat-grid-compact">
        <StatCard
          label="Pending bills"
          value={pendingBillCount}
          icon={Clock}
          tone="warning"
          sub={`${formatCurrency(outstanding)} outstanding`}
        />
        <StatCard label="Subscriptions / month" value={Math.round(perMonth)} format={formatCurrency} icon={IndianRupee} tone="primary" />
        <StatCard label="Document alerts" value={expiryAlerts.length} icon={AlertTriangle} tone="danger" />
        <StatCard
          label="Tasks today"
          value={tasksToday}
          icon={CheckSquare}
          tone="primary"
          sub={tasksOverdue > 0 ? `${tasksOverdue} overdue` : 'None overdue'}
        />
      </div>

      <div className="attention-layout">
        <NeedsAttention
          bills={bills}
          documents={documents}
          subscriptions={subscriptions}
          tasks={tasks}
          appointments={appointments}
          snoozes={snoozes}
        />
        <Recommendations recs={recs} hasAnyData={hasAnyData} />
        <div className="summary-grid">
          <SpendingCard data={spending} />
          <ProductivityCard data={productivity} />
        </div>
      </div>

      <DashboardCharts bills={bills} tasks={tasks} />

      <div className="dash-grid">
        <Panel title="Document expiry alerts" to="/documents">
          {expiryAlerts.length === 0 ? (
            <Empty text="No documents are close to expiring." />
          ) : (
            expiryAlerts.slice(0, 5).map((d) => (
              <Row
                key={d.id}
                kind="document"
                title={d.type}
                meta={d.holder}
                date={formatDate(d.expiryDate)}
                badge={<StatusBadge status={daysUntil(d.expiryDate) < 0 ? 'expired' : 'expiring'} />}
              />
            ))
          )}
        </Panel>

        <Panel title="Recent activity" to="/activity">
          {recentActivity.length === 0 ? (
            <Empty text="Your recent changes will appear here." />
          ) : (
            recentActivity.map((e) => (
              <Row
                key={e.id}
                kind={e.type}
                title={describeActivity(e)}
                meta={formatDateTime(e.timestamp)}
              />
            ))
          )}
        </Panel>
      </div>
    </>
  )
}
