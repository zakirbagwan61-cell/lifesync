import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Page names for the browser tab title, one per route.
const TITLES = {
  '/': 'Dashboard',
  '/bills': 'Bills & Payments',
  '/documents': 'Documents',
  '/subscriptions': 'Subscriptions',
  '/tasks': 'Tasks & Appointments',
  '/reminders': 'Reminders',
  '/calendar': 'Calendar',
  '/activity': 'Activity History',
  '/search': 'Search',
}

// Makes page navigation work for keyboard and screen reader users:
//  - the browser tab title names the current page ("Bills & Payments | LifeSync")
//  - after navigating to a new page, keyboard focus moves to its main heading
// Used once, in AppLayout. The first page load keeps focus where it is, so the
// "Skip to content" link stays the first Tab stop.
export default function useRouteAccessibility() {
  const { pathname } = useLocation()
  const previous = useRef(null)

  useEffect(() => {
    // A trailing slash ("/bills/") is the same page as "/bills"; anything unknown is the 404 page
    const title = TITLES[pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname] || 'Page not found'
    document.title = `${title} | LifeSync`

    if (previous.current !== null && previous.current !== pathname) {
      const heading = document.querySelector('main h1')
      if (heading) {
        heading.setAttribute('tabindex', '-1') // lets a heading receive focus from code
        heading.focus()
      }
    }
    previous.current = pathname
  }, [pathname])
}
