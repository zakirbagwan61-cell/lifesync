import { Menu, Search, Plus } from 'lucide-react'

// Top bar: hamburger (mobile only), search box, Quick Add button.
// Search and Quick Add are wired up in a later phase; for now they are the UI only.
export default function Topbar({ onMenuClick }) {
  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={24} />
      </button>

      <div className="search-box">
        <Search size={18} />
        <input type="search" placeholder="Search bills, documents, tasks..." />
      </div>

      <div className="topbar-spacer" />

      <button className="btn-primary" aria-label="Quick Add">
        <Plus size={18} />
        <span className="btn-label">Quick Add</span>
      </button>
    </header>
  )
}
