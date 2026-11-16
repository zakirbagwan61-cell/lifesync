// A summary number with an icon, used on the Dashboard and module pages.
// `tone` picks the icon color: primary | success | warning | danger | neutral
//   <StatCard label="Pending bills" value={4} icon={Receipt} tone="warning" />
export default function StatCard({ label, value, icon: Icon, tone = 'primary' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon tone-${tone}`}>{Icon && <Icon size={22} />}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
