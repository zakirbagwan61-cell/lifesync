import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Bills from './pages/Bills'
import Documents from './pages/Documents'
import Subscriptions from './pages/Subscriptions'
import Tasks from './pages/Tasks'
import Reminders from './pages/Reminders'
import CalendarPage from './pages/CalendarPage'
import Activity from './pages/Activity'
import Search from './pages/Search'

// Route table: every page is rendered inside <AppLayout> (sidebar + topbar).
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
