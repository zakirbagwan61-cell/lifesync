import useCountUp from '../../hooks/useCountUp'

// A summary number with an icon, used on the Dashboard and module pages.
// `tone` picks the icon color: primary | success | warning | danger | neutral
// A numeric `value` counts up once on first load; pass `format` to display it (e.g. as currency).
// `sub` adds a small line under the label (for example "₹18,248 outstanding").
//   <StatCard label="Pending bills" value={4} icon={Receipt} tone="warning" />
export default function StatCard({
  label, value, icon: Icon, tone = 'primary', format, sub,
}) {
  const isNumber = typeof value === 'number'
  const counted = useCountUp(isNumber ? value : 0, label)
  const show = (n) => (format ? format(n) : n)
  // A long figure (for example ₹1,23,45,678) gets a smaller size so it stays inside its card.
  const long = String(isNumber ? show(value) : value).length > 9

  return (
    <div className="stat-card">
      <div className={`stat-icon tone-${tone}`}>{Icon && <Icon size={22} />}</div>
      <div className="stat-body">
        {isNumber ? (
          <div className={`stat-value${long ? ' is-long' : ''}`}>
            {/* Screen readers get the final number, not the counting one */}
            <span aria-hidden="true">{show(counted)}</span>
            <span className="sr-only">{show(value)}</span>
          </div>
        ) : (
          <div className={`stat-value${long ? ' is-long' : ''}`}>{value}</div>
        )}
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}
