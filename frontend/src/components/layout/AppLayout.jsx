import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

// The shell shown on every page: sidebar + topbar, and the current page inside <Outlet />.
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false) // only matters on mobile

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
