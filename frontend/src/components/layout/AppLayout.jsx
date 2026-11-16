import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import QuickAdd from './QuickAdd'

// The shell shown on every page: sidebar + topbar, and the current page inside <Outlet />.
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false) // only matters on mobile
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onQuickAdd={() => setQuickAddOpen(true)}
        />
        <main className="page">
          <Outlet />
        </main>
      </div>

      {/* Lives here (not inside the topbar) so the popup appears above everything */}
      <QuickAdd isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  )
}