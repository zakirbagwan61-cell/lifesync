import { BarChart3 } from 'lucide-react'

// The card around every chart: title, optional control on the right, a note, and
// a designed empty state when there is not enough data yet.
//   <ChartCard title="..." subtitle="..." empty={!hasData} emptyText="...">{chart}</ChartCard>
export default function ChartCard({ title, subtitle, action, empty, emptyText, note, wide, bare, children }) {
  return (
    <section className={`${bare ? '' : 'panel '}chart-card${wide ? ' chart-wide' : ''}`} aria-label={bare ? title : undefined}>
      <div className="chart-head">
        <div>
          {bare ? <h3>{title}</h3> : <h2>{title}</h2>}
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {action}
      </div>

      {empty ? (
        <div className="chart-empty">
          <BarChart3 size={22} aria-hidden="true" />
          <p>{emptyText}</p>
        </div>
      ) : (
        children
      )}

      {!empty && note && <p className="chart-note">{note}</p>}
    </section>
  )
}
