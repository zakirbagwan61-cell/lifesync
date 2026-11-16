// Title + subtitle on the left, an optional action (usually an "Add" button) on the right.
//   <PageHeader title="Bills" subtitle="Track your bills" action={<button>Add</button>} />
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
