import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import QuickAdd from './QuickAdd'
import useRouteAccessibility from '../../hooks/useRouteAccessibility'

// The shell shown on every page: sidebar + topbar, and the current page inside <Outlet />.
export default function AppLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false) // only matters on mobile
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  useRouteAccessibility() // page title + focus on the new page's heading

  // "Skip to content": jump past the sidebar and top bar. Handled here (not as a #hash link)
  // so the address bar stays clean and the router is not involved.
  const skipToContent = (e) => {
    e.preventDefault()
    document.getElementById('main-content')?.focus()
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link" onClick={skipToContent}>
        Skip to content
      </a>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onQuickAdd={() => setQuickAddOpen(true)}
        />
        <main className="page" id="main-content" tabIndex={-1}>
          {/* Keyed by route so each page fades in gently when you navigate */}
          <div className="page-content" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Lives here (not inside the topbar) so the popup appears above everything */}
      <QuickAdd isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  )
}