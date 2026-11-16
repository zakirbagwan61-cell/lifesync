// One badge for every status in the app, so colors stay consistent everywhere.
// To add a status, add one line to the `statuses` map below.
const statuses = {
  overdue: { label: 'Overdue', tone: 'danger' },
  soon: { label: 'Due soon', tone: 'warning' },
  pending: { label: 'Pending', tone: 'neutral' },
  paid: { label: 'Paid', tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
  valid: { label: 'Valid', tone: 'success' },
  expiring: { label: 'Expiring soon', tone: 'warning' },
  expired: { label: 'Expired', tone: 'danger' },
  high: { label: 'High', tone: 'danger' },
  medium: { label: 'Medium', tone: 'warning' },
  low: { label: 'Low', tone: 'success' },
}

//   <StatusBadge status="overdue" />
export default function StatusBadge({ status }) {
  const info = statuses[status] || { label: status, tone: 'neutral' }
  return <span className={`badge tone-${info.tone}`}>{info.label}</span>
}
