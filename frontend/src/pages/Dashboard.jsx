import { Link } from 'react-router-dom'
import { Clock, CheckCircle, IndianRupee, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import DashboardCharts from '../components/charts/DashboardCharts'
import { formatCurrency, formatDate, daysUntil, todayString } from '../utils/helpers'
import { buildReminders, groupReminders } from '../utils/reminders'
import {
  KIND_ICONS, KIND_TONES, describeActivity, formatDateTime, formatTime, dueStatus, relativeDays,
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
  const today = todayString()

  // ----- Numbers for the stat cards -----
  const unpaidBills = bills.filter((b) => b.status !== 'paid')
  const paidCount = bills.length - unpaidBills.length
  const perMonth = subscriptions.reduce(
    (sum, s) => sum + (s.cycle === 'Yearly' ? s.cost / 12 : s.cost),
    0
  )

  // ----- Panel data -----
  const upcomingPayments = [...unpaidBills]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)

  const expiryAlerts = documents
    .filter((d) => d.expiryDate && daysUntil(d.expiryDate) <= DOC_ALERT_DAYS)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))

  // Today: tasks due today (or already overdue) and today's appointments.
  const todayTasks = tasks.filter((t) => !t.completed && t.deadline <= today)
  const todayAppointments = appointments
    .filter((a) => !a.completed && a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))

  const recentActivity = activity.slice(0, 6)

  // Timeline: everything overdue or coming up soon, from all modules, in date order.
  const groups = groupReminders(
    buildReminders({ bills, documents, subscriptions, tasks, appointments }),
    snoozes
  )
  const timeline = [...groups.overdue, ...groups.upcoming].slice(0, 10)

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

      <div className="stat-grid">
        <StatCard
          label="Pending bills"
          value={unpaidBills.length}
          icon={Clock}
          tone="warning"
          featured
          progress={bills.length ? (paidCount / bills.length) * 100 : 0}
          caption={`${paidCount} of ${bills.length} bills paid`}
        />
        <StatCard label="Completed bills" value={paidCount} icon={CheckCircle} tone="success" />
        <StatCard label="Subscriptions / month" value={Math.round(perMonth)} format={formatCurrency} icon={IndianRupee} tone="primary" />
        <StatCard label="Document alerts" value={expiryAlerts.length} icon={AlertTriangle} tone="danger" />
      </div>

      <DashboardCharts bills={bills} tasks={tasks} />

      <div className="dash-grid">
        <Panel title="Upcoming payments" to="/bills">
          {upcomingPayments.length === 0 ? (
            <Empty text="No pending bills. You're all caught up." />
          ) : (
            upcomingPayments.map((b) => (
              <Row
                key={b.id}
                kind="bill"
                title={b.title}
                meta={formatCurrency(b.amount)}
                date={formatDate(b.dueDate)}
                badge={<StatusBadge status={dueStatus(b.dueDate, false)} />}
              />
            ))
          )}
        </Panel>

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

        <Panel title="Today's tasks & appointments" to="/tasks">
          {todayTasks.length + todayAppointments.length === 0 ? (
            <Empty text="Nothing planned for today." />
          ) : (
            <>
              {todayAppointments.map((a) => (
                <Row
                  key={a.id}
                  kind="appointment"
                  title={a.title}
                  meta={[formatTime(a.time), a.location].filter(Boolean).join(' · ')}
                />
              ))}
              {todayTasks.map((t) => (
                <Row
                  key={t.id}
                  kind="task"
                  title={t.title}
                  meta={relativeDays(t.deadline)}
                  badge={<StatusBadge status={t.priority.toLowerCase()} />}
                />
              ))}
            </>
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

      <Panel title="Timeline: what needs your attention" to="/reminders">
        {timeline.length === 0 ? (
          <Empty text="Nothing coming up soon." />
        ) : (
          timeline.map((r) => (
            <Row
              key={r.id}
              kind={r.kind}
              title={r.title}
              meta={`${r.label}${r.detail ? ` · ${r.detail}` : ''}`}
              date={formatDate(r.date)}
              badge={<StatusBadge status={dueStatus(r.date, false)} />}
            />
          ))
        )}
      </Panel>
    </>
  )
}