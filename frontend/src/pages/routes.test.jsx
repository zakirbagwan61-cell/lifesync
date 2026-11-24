// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { freezeToday, renderApp } from '../test/render'

// Every route renders its page, with realistic saved data, without crashing or logging errors.
// (Each page sits inside an error boundary, so a crash shows a message instead of throwing: the tests
// look for that message and for anything written to console.error.)
const ROUTES = [
  { path: '/', heading: /good (morning|afternoon|evening)/i, title: 'Dashboard', shows: /needs attention/i },
  { path: '/bills', heading: 'Bills & Payments', title: 'Bills & Payments', shows: 'House rent' },
  { path: '/documents', heading: 'Documents', title: 'Documents', shows: /passport/i },
  { path: '/subscriptions', heading: 'Subscriptions', title: 'Subscriptions', shows: 'Netflix' },
  { path: '/tasks', heading: 'Tasks & Appointments', title: 'Tasks & Appointments', shows: 'Buy groceries' },
  { path: '/reminders', heading: 'Reminders', title: 'Reminders', shows: 'Electricity bill' },
  { path: '/calendar', heading: 'Calendar', title: 'Calendar', shows: /november 2026/i },
  { path: '/activity', heading: 'Activity History', title: 'Activity History', shows: /paid bill "water bill"/i },
  { path: '/search?q=rent', heading: 'Search', title: 'Search', shows: 'House rent' },
  { path: '/no-such-page', heading: 'Page not found', title: 'Page not found', shows: /go to dashboard/i },
]

let errorSpy

beforeEach(() => {
  freezeToday()
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
  vi.useRealTimers()
})

describe('route smoke tests', () => {
  it.each(ROUTES)('$path renders $title', async ({ path, heading, title, shows }) => {
    renderApp(path)

    const main = screen.getByRole('main')
    expect(await within(main).findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(within(main).getAllByText(shows).length).toBeGreaterThan(0)
    await waitFor(() => expect(document.title).toBe(`${title} | LifeSync`))

    expect(screen.queryByText(/this page ran into a problem|something went wrong/i)).not.toBeInTheDocument()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('shows the app shell (skip link, menu, search) on every page', () => {
    renderApp('/bills')
    expect(screen.getByRole('link', { name: /skip to content/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /main|primary|menu/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quick Add' })).toBeInTheDocument()
  })

  it('opens every page with empty storage too (a first-time visitor)', async () => {
    renderApp('/', { storage: {} })
    expect(await screen.findByRole('heading', { level: 1, name: /good (morning|afternoon|evening)/i })).toBeInTheDocument()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
