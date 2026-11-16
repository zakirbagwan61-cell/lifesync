import { useApp } from '../context/AppContext'

export default function Dashboard() {
  const { userName } = useApp()
  return (
    <>
      <h1>Welcome, {userName}</h1>
      <p className="subtitle">Your upcoming payments, reminders and tasks will appear here.</p>
      <div className="placeholder-card">Dashboard widgets arrive in Phase 7.</div>
    </>
  )
}
