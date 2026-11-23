import useCountUp from '../../hooks/useCountUp'

// A summary number with an icon, used on the Dashboard and module pages.
// `tone` picks the icon color: primary | success | warning | danger | neutral
// A numeric `value` counts up once on first load; pass `format` to display it (e.g. as currency).
// `featured` gives the card the brand gradient; `progress` (0-100) adds a small progress bar.
//   <StatCard label="Pending bills" value={4} icon={Receipt} tone="warning" />
export default function StatCard({
  label, value, icon: Icon, tone = 'primary', format, featured = false, progress, caption,
}) {
  const isNumber = typeof value === 'number'
  const counted = useCountUp(isNumber ? value : 0, label)
  const show = (n) => (format ? format(n) : n)

  return (
    <div className={`stat-card${featured ? ' featured' : ''}`}>
      <div className={`stat-icon tone-${tone}`}>{Icon && <Icon size={22} />}</div>
      <div className="stat-body">
        {isNumber ? (
          <div className="stat-value">
            {/* Screen readers get the final number, not the counting one */}
            <span aria-hidden="true">{show(counted)}</span>
            <span className="sr-only">{show(value)}</span>
          </div>
        ) : (
          <div className="stat-value">{value}</div>
        )}
        <div className="stat-label">{label}</div>
        {progress !== undefined && (
          <div className="progress-block">
            <div
              className="progress"
              role="progressbar"
              aria-label={caption || label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div className="progress-fill" style={{ '--p': Math.max(0, Math.min(progress, 100)) / 100 }} />
            </div>
            {caption && <div className="progress-caption">{caption}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
