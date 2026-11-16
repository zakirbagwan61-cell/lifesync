import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Plus } from 'lucide-react'

// Top bar: hamburger (mobile only), search box, Quick Add button.
// Press Enter in the search box to open the Search page with your text.
export default function Topbar({ onMenuClick, onQuickAdd }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault() // stop the browser from reloading the page
    const text = query.trim()
    if (text) navigate(`/search?q=${encodeURIComponent(text)}`)
  }

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={24} />
      </button>

      <form className="search-box" onSubmit={handleSearch}>
        <Search size={18} />
        <input
          type="search"
          placeholder="Search bills, documents, tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="topbar-spacer" />

      <button className="btn-primary" onClick={onQuickAdd} aria-label="Quick Add">
        <Plus size={18} />
        <span className="btn-label">Quick Add</span>
      </button>
    </header>
  )
}