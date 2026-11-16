import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Repeat,
  CheckSquare,
  Bell,
  CalendarDays,
  History,
  Sparkles,
} from 'lucide-react'

// One entry per sidebar link. Add a line here to add a new menu item.
const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bills', label: 'Bills & Payments', icon: Receipt },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/tasks', label: 'Tasks & Appointments', icon: CheckSquare },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/activity', label: 'Activity History', icon: History },
]

// `isOpen` / `onClose` control the slide-in drawer on mobile.
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="brand">
          <Sparkles size={26} />
          <div>
            LifeSync
            <small>One place for everything that matters</small>
          </div>
        </div>

        <nav className="nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'} // "/" should only be active on the exact home page
              className="nav-link"
              onClick={onClose} // close the drawer after tapping a link on mobile
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Dark backdrop behind the drawer on mobile; tap it to close */}
      <div className={`overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
    </>
  )
}
