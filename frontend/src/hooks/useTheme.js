import { useState, useEffect } from 'react'

// Light / dark theme.
// The choice is saved under its own key ("lifesync-theme"), separate from all app data,
// so changing the theme can never touch your bills, documents, tasks, etc.
// index.html applies the saved theme before the page paints; this hook keeps it in sync.
const STORAGE_KEY = 'lifesync-theme'

export default function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light')

  // Whenever the theme changes: update the <html> tag and remember the choice.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // storage blocked: the theme still works until the page is closed
    }
  }, [theme])

  const toggleTheme = () => {
    // A short-lived class that animates the colour change smoothly.
    const root = document.documentElement
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 300)
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
