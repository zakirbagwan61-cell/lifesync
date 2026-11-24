import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Plus, Moon, Sun, Bell } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import useTheme from '../../hooks/useTheme'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { buildReminders, groupReminders } from '../../utils/reminders'
import { buildSearchItems, filterSearchItems, rankSearchResults, searchItemPath } from '../../utils/search'
import { KIND_ICONS, KIND_TONES } from '../../utils/display'

const KIND_NAMES = { bill: 'Bill', document: 'Document', subscription: 'Subscription', task: 'Task', appointment: 'Appointment' }
const MAX_SUGGESTIONS = 6
const MIN_CHARS = 2

// Top bar: hamburger (mobile only), search box, theme toggle, reminders bell, Quick Add button.
// While you type, matching items appear under the box (after a short pause). Use the arrow keys and
// Enter to open one exactly, or press Enter with nothing highlighted to open the Search page.
export default function Topbar({ onMenuClick, onQuickAdd }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false) // only true after the user types, never from the URL
  const [active, setActive] = useState(-1) // highlighted option; the last one is "See all results"
  const boxRef = useRef(null)
  // On small screens the full hint does not fit in the box, so it is shortened there
  const [compact, setCompact] = useState(() => window.matchMedia?.('(max-width: 560px)').matches ?? false)

  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 560px)')
    if (!media) return undefined
    const update = (e) => setCompact(e.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // When the Search page is showing (for example after a reload or a shared link),
  // the box shows the word that is being searched for.
  useEffect(() => {
    if (location.pathname === '/search') {
      setQuery(new URLSearchParams(location.search).get('q') || '')
    }
  }, [location.pathname, location.search])
  const { theme, toggleTheme } = useTheme()
  const { bills, documents, subscriptions, tasks, appointments, snoozes } = useApp()

  // The bell shows how many reminders are overdue (read-only: nothing is changed here).
  const overdue = groupReminders(
    buildReminders({ bills, documents, subscriptions, tasks, appointments }),
    snoozes
  ).overdue.length

  // ----- Live suggestions -----
  const debounced = useDebouncedValue(query.trim(), 200)
  const items = useMemo(
    () => buildSearchItems({ bills, documents, subscriptions, tasks, appointments }),
    [bills, documents, subscriptions, tasks, appointments]
  )
  const allMatches = useMemo(
    () => (debounced.length >= MIN_CHARS ? rankSearchResults(filterSearchItems(items, debounced), debounced) : []),
    [items, debounced]
  )
  const suggestions = allMatches.slice(0, MAX_SUGGESTIONS)
  const waiting = query.trim() !== debounced // the user is still typing
  const listVisible = open && query.trim().length >= MIN_CHARS
  const seeAllIndex = suggestions.length

  useEffect(() => setActive(-1), [debounced])

  // Close when clicking away from the search box.
  useEffect(() => {
    if (!open) return undefined
    const close = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const openItem = (item) => {
    setOpen(false)
    setQuery('')
    navigate(searchItemPath(item))
  }

  const seeAll = () => {
    const text = query.trim()
    setOpen(false)
    if (text) navigate(`/search?q=${encodeURIComponent(text)}`)
  }

  const handleSearch = (e) => {
    e.preventDefault() // stop the browser from reloading the page
    if (listVisible && !waiting && active >= 0 && active < suggestions.length) openItem(suggestions[active])
    else seeAll()
  }

  const handleKeyDown = (e) => {
    const optionCount = suggestions.length + 1
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!listVisible || waiting) return
      e.preventDefault()
      setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % optionCount : (i - 1 + optionCount) % optionCount))
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
      setActive(-1)
    }
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const seeAllText =
    allMatches.length === 0
      ? `No matches. Search all for "${query.trim()}"`
      : `See all ${allMatches.length} result${allMatches.length === 1 ? '' : 's'} for "${query.trim()}"`

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <form className="search-box" onSubmit={handleSearch} role="search" ref={boxRef}>
        <Search size={18} />
        <input
          type="search"
          placeholder={compact ? 'Search...' : 'Search bills, documents, tasks...'}
          aria-label="Search bills, documents, tasks"
          role="combobox"
          aria-expanded={listVisible}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={listVisible && active >= 0 ? `search-option-${active}` : undefined}
          autoComplete="off"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (query.trim()) setOpen(true) }}
          onKeyDown={handleKeyDown}
        />

        {listVisible && (
          <div className="search-suggest">
            <ul id="search-suggestions" role="listbox" aria-label="Search suggestions">
              {!waiting && suggestions.map((r, i) => {
                const Icon = KIND_ICONS[r.kind]
                return (
                  <li
                    key={r.id}
                    id={`search-option-${i}`}
                    role="option"
                    aria-selected={active === i}
                    className={`suggest-row${active === i ? ' active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                    onClick={() => openItem(r)}
                    onMouseEnter={() => setActive(i)}
                  >
                    <span className={`list-icon tone-${KIND_TONES[r.kind]}`}><Icon size={16} /></span>
                    <span className="list-main">
                      <strong>{r.title}</strong>
                      <span className="muted">{KIND_NAMES[r.kind]}{r.meta ? ` · ${r.meta}` : ''}</span>
                    </span>
                  </li>
                )
              })}
              {!waiting && (
                <li
                  id={`search-option-${seeAllIndex}`}
                  role="option"
                  aria-selected={active === seeAllIndex}
                  className={`suggest-row suggest-all${active === seeAllIndex ? ' active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={seeAll}
                  onMouseEnter={() => setActive(seeAllIndex)}
                >
                  {seeAllText}
                </li>
              )}
            </ul>
            <span className="sr-only" role="status">
              {waiting ? '' : allMatches.length === 0 ? 'No suggestions' : `${allMatches.length} suggestion${allMatches.length === 1 ? '' : 's'} available`}
            </span>
          </div>
        )}
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
