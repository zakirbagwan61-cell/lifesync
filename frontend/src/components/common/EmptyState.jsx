// Friendly message shown when a list has no items yet.
//   <EmptyState icon={Receipt} title="No bills" message="Add your first bill." action={<button/>} />
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={40} />}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}
