import { useMemo, useState } from 'react'
import ChartCard from './ChartCard'
import AreaChart from './AreaChart'
import DonutChart from './DonutChart'
import BarChart from './BarChart'
import {
  monthWindow, spendingByMonth, spendingByCategory, paymentStatus, tasksByMonth,
} from './chartUtils'
import Tabs, { tabPanelProps } from '../common/Tabs'
import { formatCurrency } from '../../utils/helpers'
import { financialInsight } from '../../utils/insights'

const CATEGORY_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

const TABS = [
  { key: 'spending', label: 'Spending trend' },
  { key: 'categories', label: 'Categories' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'status', label: 'Bill status' },
]

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// The four dashboard charts, shown one at a time in tabs. Everything is calculated from the bills and tasks passed in
// (they come from Context), so the charts update the moment an item is added, edited or deleted.
export default function DashboardCharts({ bills, tasks }) {
  const [tab, setTab] = useState('spending') // not saved: always opens on Spending trend
  const [categoryMode, setCategoryMode] = useState('paid') // 'paid' | 'all'

  const spending = useMemo(() => spendingByMonth(bills, monthWindow(5)), [bills])
  const categories = useMemo(() => spendingByCategory(bills, categoryMode), [bills, categoryMode])
  const status = useMemo(() => paymentStatus(bills), [bills])
  const taskData = useMemo(() => tasksByMonth(tasks, monthWindow(3, 2)), [tasks])

  const spendingTotal = spending.data.reduce((sum, d) => sum + d.value, 0)
  const categoryTotal = categories.reduce((sum, c) => sum + c.value, 0)
  const statusSlices = [
    { label: 'Paid', value: status.paid, color: 'var(--success)' },
    { label: 'Pending', value: status.pending, color: 'var(--warning)' },
    { label: 'Overdue', value: status.overdue, color: 'var(--danger)' },
  ].filter((s) => s.value > 0)
  const statusTotal = status.paid + status.pending + status.overdue
  const taskPoints = taskData.data.reduce((sum, d) => sum + d.completed + d.pending, 0)

  // With very little history a chart can look empty or lopsided, so say so instead of leaving it unexplained.
  const spendingMonths = spending.data.filter((d) => d.value > 0).length
  const taskMonths = taskData.data.filter((d) => d.completed + d.pending > 0).length
  const joinNotes = (...notes) => notes.filter(Boolean).join(' ') || null

  const modeToggle = (
    <div className="seg" role="group" aria-label="Category data">
      <button type="button" className={categoryMode === 'paid' ? 'active' : ''} aria-pressed={categoryMode === 'paid'} onClick={() => setCategoryMode('paid')}>
        Paid
      </button>
      <button type="button" className={categoryMode === 'all' ? 'active' : ''} aria-pressed={categoryMode === 'all'} onClick={() => setCategoryMode('all')}>
        All bills
      </button>
    </div>
  )

  const finance = useMemo(() => financialInsight(bills), [bills])
  const moneyRows = [
    { key: 'paid', label: 'Paid', color: 'var(--success)', ...finance.paid },
    { key: 'pending', label: 'Pending', color: 'var(--warning)', ...finance.pending },
    { key: 'overdue', label: 'Overdue', color: 'var(--danger)', ...finance.overdue },
  ]

  let chart
  if (tab === 'spending') {
    chart = (
      <ChartCard
        bare
        title="Monthly spending"
        subtitle="Bills paid in the last 6 months"
        empty={spendingTotal === 0}
        emptyText="Mark a bill as paid and your monthly spending will appear here."
        note={joinNotes(
          spendingMonths === 1 && 'Only one month of payments so far. The trend fills in as you pay more bills.',
          spending.hidden > 0 && `${plural(spending.hidden, 'older payment')} not shown`
        )}
      >
        <AreaChart
          data={spending.data}
          format={formatCurrency}
          seriesName="Paid"
          ariaLabel="Monthly spending on paid bills for the last 6 months"
        />
      </ChartCard>
    )
  } else if (tab === 'categories') {
    chart = (
      <ChartCard
        bare
        title="Expense by category"
        subtitle={categoryMode === 'paid' ? 'Paid bills' : 'All bills, paid and unpaid'}
        action={modeToggle}
        empty={categories.length === 0}
        emptyText={categoryMode === 'paid' ? 'Paid bills will be grouped by category here.' : 'Add a bill to see it grouped by category.'}
        note={categoryMode === 'paid' && categories.length === 1 ? 'Only one category so far. Choose "All bills" to include bills still to pay.' : null}
      >
        <DonutChart
          slices={categories.map((c, i) => ({ ...c, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))}
          format={formatCurrency}
          tooltip
          centerValue={formatCurrency(categoryTotal)}
          centerLabel="Total"
          ariaLabel={`Expense by category: ${categories.map((c) => `${c.label} ${formatCurrency(c.value)}`).join(', ')}`}
        />
      </ChartCard>
    )
  } else if (tab === 'tasks') {
    chart = (
      <ChartCard
        bare
        title="Task completion"
        subtitle="Completed tasks by month done, pending tasks by month due"
        empty={taskPoints === 0}
        emptyText="Add tasks and complete them to compare progress over time."
        note={joinNotes(
          taskMonths === 1 && 'Only one month of tasks so far. The chart fills in as you plan and complete more.',
          taskData.hidden > 0 && `${plural(taskData.hidden, 'task')} outside this range not shown`
        )}
      >
        <BarChart data={taskData.data} ariaLabel="Completed and pending tasks per month" />
      </ChartCard>
    )
  } else {
    chart = (
      <ChartCard
        bare
        title="Payment status"
        subtitle="All bills right now"
        empty={statusTotal === 0}
        emptyText="Add a bill to see how many are paid, pending or overdue."
      >
        <div className="status-tab">
          <DonutChart
            slices={statusSlices}
            format={(n) => String(n)}
            centerValue={String(statusTotal)}
            centerLabel={statusTotal === 1 ? 'Bill' : 'Bills'}
            ariaLabel={`Payment status: ${status.paid} paid, ${status.pending} pending, ${status.overdue} overdue`}
          />
          {/* Amounts for the same three groups (the donut shows counts) */}
          <div className="status-money">
            <div className="insight-figure">
              {formatCurrency(finance.outstanding)}
              <span className="insight-figure-note">still to pay</span>
            </div>
            <ul className="money-rows">
              {moneyRows.map((r) => (
                <li key={r.key}>
                  <span className="legend-dot" style={{ background: r.color }} />
                  <span className="money-label">{r.label}<small>{plural(r.count, 'bill')}</small></span>
                  <span className="money-amount">{formatCurrency(r.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ChartCard>
    )
  }

  return (
    <section className="panel analytics" aria-labelledby="analytics-title">
      <div className="panel-header analytics-head">
        <h2 id="analytics-title">Analytics</h2>
        <div className="scroll-tabs">
          <Tabs id="analytics-tabs" label="Analytics charts" tabs={TABS} value={tab} onChange={setTab} />
        </div>
      </div>
      <div {...tabPanelProps('analytics-tabs', tab)}>{chart}</div>
    </section>
  )
}
