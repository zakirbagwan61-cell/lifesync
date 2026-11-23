import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Search, Plus, Moon, Sun, Bell } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import useTheme from '../../hooks/useTheme'
import { buildReminders, groupReminders } from '../../utils/reminders'

// Top bar: hamburger (mobile only), search box, theme toggle, reminders bell, Quick Add button.
// Press Enter in the search box to open the Search page with your text.
export default function Topbar({ onMenuClick, onQuickAdd }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { theme, toggleTheme } = useTheme()
  const { bills, documents, subscriptions, tasks, appointments, snoozes } = useApp()

  // The bell shows how many reminders are overdue (read-only: nothing is changed here).
  const overdue = groupReminders(
    buildReminders({ bills, documents, subscriptions, tasks, appointments }),
    snoozes
  ).overdue.length

  const handleSearch = (e) => {
    e.preventDefault() // stop the browser from reloading the page
    const text = query.trim()
    if (text) navigate(`/search?q=${encodeURIComponent(text)}`)
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <form className="search-box" onSubmit={handleSearch} role="search">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search bills, documents, tasks..."
          aria-label="Search bills, documents, tasks"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <button
          className="topbar-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link
          to="/reminders"
          className="topbar-btn"
          aria-label={overdue > 0 ? `Reminders, ${overdue} overdue` : 'Reminders'}
          title="Reminders"
        >
          <Bell size={18} />
          {overdue > 0 && <span className="topbar-badge">{overdue > 9 ? '9+' : overdue}</span>}
        </Link>

        <button className="btn-primary" onClick={onQuickAdd} aria-label="Quick Add">
          <Plus size={18} />
          <span className="btn-label">Quick Add</span>
        </button>
      </div>
    </header>
  )
}
