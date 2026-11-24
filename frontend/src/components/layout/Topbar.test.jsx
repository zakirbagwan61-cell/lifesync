// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { freezeToday, renderApp } from '../../test/render'

// The top bar's live search, on fixed data (5 modules, today = 24 Nov 2026). The suggestions appear
// after a short pause (200 ms), so these tests wait for them with findBy/waitFor.
let user

const box = () => screen.getByRole('combobox', { name: /search/i })
const list = () => screen.getByRole('listbox', { name: /search suggestions/i })
const options = () => within(list()).getAllByRole('option')
const optionNames = () => options().map((o) => o.textContent)
// Wait until the suggestions have arrived (the list frame is there while typing; the rows come after the pause).
const suggestions = async () => within(await screen.findByRole('listbox', { name: /search suggestions/i })).findAllByRole('option')
const suggestion = async (name) => within(await screen.findByRole('listbox', { name: /search suggestions/i })).findByRole('option', { name })

beforeEach(() => {
  freezeToday()
  user = userEvent.setup()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Topbar live search', () => {
  it('needs two characters before suggesting anything', async () => {
    renderApp('/')
    await user.type(box(), 'd')
    await new Promise((r) => setTimeout(r, 350)) // longer than the pause
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(box()).toHaveAttribute('aria-expanded', 'false')
  })

  it('suggests matches from every module after the pause, with the type shown', async () => {
    renderApp('/')
    await user.type(box(), 'in')

    await suggestions()
    expect(box()).toHaveAttribute('aria-expanded', 'true')
    const names = optionNames().join(' | ')
    expect(names).toMatch(/Insurance \(Asha Verma\).*Document/) // a document, number masked below
    expect(names).toMatch(/Call insurance agent.*Task/)
    expect(names).toMatch(/Dentist check-up.*Appointment/) // found through its location, "Smile Dental Clinic"
    expect(names).not.toMatch(/P1234567/) // the full document number is never shown
  })

  it('does not search on every keystroke: it waits until typing pauses', async () => {
    renderApp('/')
    await user.type(box(), 'dent') // typed quickly, one burst
    expect(screen.queryByRole('option', { name: /dentist check-up/i })).not.toBeInTheDocument() // too soon: still waiting
    expect(await suggestion(/dentist check-up/i)).toBeInTheDocument()
  })

  it('puts titles that start with the query first', async () => {
    renderApp('/')
    await user.type(box(), 're')
    await suggestions()
    const titles = options().slice(0, -1).map((o) => o.querySelector('strong').textContent)
    const firstContaining = titles.findIndex((t) => !t.toLowerCase().startsWith('re'))
    const lastStarting = titles.map((t) => t.toLowerCase().startsWith('re')).lastIndexOf(true)
    expect(titles.length).toBeGreaterThan(1)
    expect(lastStarting).toBeLessThan(firstContaining === -1 ? Infinity : firstContaining)
  })

  it('ends with a "See all" row showing the total number of results', async () => {
    renderApp('/')
    await user.type(box(), 'rent')
    await suggestions()
    const last = options().at(-1)
    expect(last).toHaveTextContent(/see all \d+ results? for "rent"/i)
  })

  it('says when nothing matches and still offers the full search', async () => {
    renderApp('/')
    await user.type(box(), 'zzzq')
    expect(await screen.findByRole('option', { name: /no matches\. search all for "zzzq"/i })).toBeInTheDocument()
    expect(screen.getByText('No suggestions')).toBeInTheDocument() // announced to screen readers
  })

  it('arrow keys move the highlight (and wrap), reported to assistive technology', async () => {
    renderApp('/')
    await user.type(box(), 'in')
    await suggestions()
    const count = options().length

    await user.keyboard('{ArrowDown}')
    expect(box()).toHaveAttribute('aria-activedescendant', 'search-option-0')
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(box()).toHaveAttribute('aria-activedescendant', `search-option-${count - 2}`) // 0 -> last -> one before last
    await user.keyboard('{ArrowDown}{ArrowDown}') // two steps down from second-to-last passes the end and wraps to the first option
    expect(box()).toHaveAttribute('aria-activedescendant', `search-option-${(count - 2 + 2) % count}`)
  })

  it('Enter on a highlighted suggestion opens that exact item and focuses it', async () => {
    renderApp('/')
    await user.type(box(), 'dentist')
    await suggestion(/dentist check-up/i)
    await user.keyboard('{ArrowDown}{Enter}')

    expect(await screen.findByRole('heading', { level: 1, name: 'Tasks & Appointments' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /appointments/i })).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(document.activeElement).toHaveAttribute('data-item-id', 'a-dentist'))
    expect(box()).toHaveValue('') // the box is cleared and the list closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clicking a suggestion opens it too (a bill)', async () => {
    renderApp('/')
    await user.type(box(), 'house')
    await user.click(await suggestion(/house rent/i))
    expect(await screen.findByRole('heading', { level: 1, name: 'Bills & Payments' })).toBeInTheDocument()
    await waitFor(() => expect(document.activeElement).toHaveAttribute('data-item-id', 'b-rent'))
  })

  it('Enter with nothing highlighted opens the full Search page with the text', async () => {
    renderApp('/')
    await user.type(box(), 'netflix')
    await suggestions()
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=netflix')
    expect(within(screen.getByRole('main')).getByText('Netflix')).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('Escape closes the list but keeps the typed text', async () => {
    renderApp('/')
    await user.type(box(), 'in')
    await suggestions()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(box()).toHaveValue('in')
    expect(box()).toHaveFocus()
  })

  it('clicking elsewhere closes the list', async () => {
    renderApp('/')
    await user.type(box(), 'in')
    await suggestions()
    await user.click(screen.getByRole('main'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows the searched word in the box on the Search page without opening suggestions', async () => {
    renderApp('/search?q=rent')
    expect(await screen.findByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument()
    expect(box()).toHaveValue('rent')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('finds a document by its holder or number but only ever shows the masked number', async () => {
    renderApp('/')
    await user.type(box(), 'P1234567')
    const option = await screen.findByRole('option', { name: /passport \(asha verma\)/i })
    expect(option).not.toHaveTextContent('P1234567')
    expect(option).toHaveTextContent('••')
  })
})
