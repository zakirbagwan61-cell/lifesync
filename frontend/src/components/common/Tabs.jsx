import { useRef } from 'react'

// Props for the area whose content changes with the selected tab, so screen readers
// connect the tab and the content:
//   <div {...tabPanelProps('bills-tabs', tab)}> ...list... </div>
export function tabPanelProps(id, activeKey) {
  return { role: 'tabpanel', id: `${id}-panel`, 'aria-labelledby': `${id}-tab-${activeKey}` }
}

// The tab bar used on Bills, Tasks, Reminders and Calendar. Looks exactly like the existing
// ".tabs" / ".tab" styling, and follows the standard keyboard pattern:
// Tab moves into the bar (to the selected tab), arrow keys move between tabs, Home/End jump to the ends.
//   <Tabs id="bills-tabs" label="Bills view" tabs={[{ key: 'upcoming', label: 'Upcoming' }, ...]}
//         value={tab} onChange={setTab} />
export default function Tabs({ id, label, tabs, value, onChange }) {
  const buttons = useRef({})

  const select = (index) => {
    const next = tabs[(index + tabs.length) % tabs.length]
    onChange(next.key)
    buttons.current[next.key]?.focus()
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select(index + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select(index - 1)
    else if (e.key === 'Home') select(0)
    else if (e.key === 'End') select(tabs.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, index) => {
        const selected = t.key === value
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`${id}-tab-${t.key}`}
            aria-selected={selected}
            aria-controls={`${id}-panel`}
            tabIndex={selected ? 0 : -1} // only the selected tab is a Tab stop; arrows reach the others
            className={`tab ${selected ? 'active' : ''}`}
            ref={(el) => { buttons.current[t.key] = el }}
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
