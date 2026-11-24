// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { freezeToday, renderApp } from '../../test/render'
import { readStored, storageFixture } from '../../test/fixtures'

// The Dashboard's "Needs attention" panel, tested through the real Dashboard with fixed data
// (today = Tue 24 Nov 2026). Expected lists, from the fixtures:
//   Today (4):   Dentist 9:30 am, Team meeting 3:00 pm, Electricity bill, Buy groceries
//   Next 7 days: those 4 + House rent (28 Nov), Netflix renews (26 Nov), Pay school fees (30 Nov)  = 7
//   Overdue (3): Mobile recharge, Call insurance agent, Insurance (expired document)
//   All (12):    overdue + upcoming (also Car service 3 Dec and the Passport expiring 8 Jan)
let user

const panel = () => screen.getByRole('region', { name: /needs attention/i })
const rowTitles = () => within(panel()).queryAllByRole('listitem').map((li) => within(li).getByText((_, el) => el.tagName === 'STRONG').textContent)
const tab = (name) => within(panel()).getByRole('tab', { name })

beforeEach(() => {
  freezeToday()
  user = userEvent.setup()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Needs attention panel', () => {
  it('opens on Today with appointments first, in time order, showing time and location', async () => {
    renderApp('/')
    await within(await screen.findByRole('region', { name: /needs attention/i })).findByRole('tab', { name: /today \(4\)/i })

    expect(rowTitles()).toEqual(['Dentist check-up', 'Team meeting', 'Electricity bill', 'Buy groceries'])
    expect(within(panel()).getByText(/9:30 am · Smile Dental Clinic/)).toBeInTheDocument()
    expect(within(panel()).getByText(/3:00 pm · Google Meet/)).toBeInTheDocument()
    expect(within(panel()).getByText(/bill due · ₹1,850/i)).toBeInTheDocument()
  })

  it('shows the right count on each tab', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })
    expect(tab(/^today/i)).toHaveTextContent('Today (4)')
    expect(tab(/^next 7 days/i)).toHaveTextContent('Next 7 days (7)')
    expect(tab(/^overdue/i)).toHaveTextContent('Overdue (3)')
    expect(tab(/^all/i)).toHaveTextContent('All (12)')
  })

  it('Next 7 days covers bills, tasks, appointments, subscriptions and stops at 7 days', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })
    await user.click(tab(/^next 7 days/i))
    expect(rowTitles()).toHaveLength(6) // 7 items, the list shows 6 until expanded
    await user.click(within(panel()).getByRole('button', { name: /show 1 more/i }))

    const titles = rowTitles()
    expect(titles).toHaveLength(7)
    expect(titles).toEqual(expect.arrayContaining(['House rent', 'Netflix', 'Pay school fees', 'Team meeting']))
    expect(titles).not.toContain('Car service') // 9 days away
    expect(titles).not.toContain('Mobile recharge') // overdue has its own tab
  })

  it('Overdue lists only past-due items, across modules', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })
    await user.click(tab(/^overdue/i))
    expect(rowTitles().sort()).toEqual(['Call insurance agent', 'Insurance (Asha Verma)', 'Mobile recharge'].sort())
    expect(within(panel()).getAllByText('Overdue').length).toBeGreaterThan(0)
  })

  it('All shows overdue and upcoming together, each item once', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })
    await user.click(tab(/^all/i))
    await user.click(within(panel()).getByRole('button', { name: /show 6 more/i })) // 12 items, 6 shown at first

    const titles = rowTitles()
    expect(titles).toHaveLength(12)
    expect(new Set(titles).size).toBe(12)
    expect(titles).toEqual(expect.arrayContaining(['Car service', 'Passport (Asha Verma)']))
    expect(within(panel()).getByRole('button', { name: /show fewer/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('the Bills chip keeps only bills and works with every tab', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })
    const chip = within(panel()).getByRole('button', { name: 'Bills' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(tab(/^today/i)).toHaveTextContent('Today (1)')
    expect(rowTitles()).toEqual(['Electricity bill'])

    await user.click(tab(/^overdue/i))
    expect(rowTitles()).toEqual(['Mobile recharge'])

    await user.click(tab(/^all/i))
    expect(rowTitles()).toEqual(['Mobile recharge', 'Electricity bill', 'House rent'])

    await user.click(chip) // turning it off brings everything back
    expect(tab(/^all/i)).toHaveTextContent('All (12)')
  })

  it('says so when a filter has nothing to show', async () => {
    renderApp('/', { storage: { lifesync_bills: [], lifesync_tasks: [], lifesync_appointments: [], lifesync_documents: [], lifesync_subscriptions: [] } })
    await screen.findByRole('region', { name: /needs attention/i })
    expect(within(panel()).getByText(/nothing is due today/i)).toBeInTheDocument()
    await user.click(tab(/^overdue/i))
    expect(within(panel()).getByText(/nothing is overdue/i)).toBeInTheDocument()
    await user.click(within(panel()).getByRole('button', { name: 'Bills' }))
    expect(within(panel()).getByText(/no bills here/i)).toBeInTheDocument()
  })

  it('tabs are keyboard accessible: arrow keys move between them, only the selected one is a tab stop', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })
    const today = tab(/^today/i)
    today.focus()
    expect(today).toHaveAttribute('tabindex', '0')
    expect(tab(/^overdue/i)).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{ArrowRight}')
    expect(tab(/^next 7 days/i)).toHaveAttribute('aria-selected', 'true')
    expect(tab(/^next 7 days/i)).toHaveFocus()
    await user.keyboard('{End}')
    expect(tab(/^all/i)).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(tab(/^today/i)).toHaveAttribute('aria-selected', 'true')
  })

  it('each row links to the exact item, and the page opens with that item focused', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })

    const link = within(panel()).getByRole('link', { name: /team meeting/i })
    expect(link).toHaveAttribute('href', '/tasks?focus=a-team&tab=appointments')
    await user.click(link)

    expect(await screen.findByRole('heading', { level: 1, name: 'Tasks & Appointments' })).toBeInTheDocument()
    await waitFor(() => expect(document.activeElement).toHaveAttribute('data-item-id', 'a-team'))
    expect(screen.getByRole('tab', { name: /appointments/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('snoozing hides the item and Undo brings it back, saving only an active snooze', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })

    await user.selectOptions(within(panel()).getByRole('combobox', { name: /snooze duration for electricity bill/i }), '3')

    expect(rowTitles()).not.toContain('Electricity bill')
    expect(tab(/^today/i)).toHaveTextContent('Today (3)')
    expect(await screen.findByText(/"Electricity bill" snoozed for 3 days/i)).toBeInTheDocument()
    expect(readStored('lifesync_snoozes')).toEqual({ 'bill-b-power': '2026-11-27' })

    await user.click(screen.getByRole('button', { name: /undo/i }))
    expect(rowTitles()).toContain('Electricity bill')
    expect(tab(/^today/i)).toHaveTextContent('Today (4)')
    expect(readStored('lifesync_snoozes')).toEqual({})
  })

  it('marking a bill paid removes it, logs it, and Undo restores it', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })

    await user.click(within(panel()).getByRole('button', { name: 'Mark paid: Electricity bill' }))
    expect(rowTitles()).not.toContain('Electricity bill')
    expect(readStored('lifesync_bills').find((b) => b.id === 'b-power').status).toBe('paid')
    expect(readStored('lifesync_activity')[0]).toMatchObject({ type: 'bill', action: 'paid', itemId: 'b-power' })

    await user.click(await screen.findByRole('button', { name: /undo/i }))
    expect(rowTitles()).toContain('Electricity bill')
    expect(readStored('lifesync_bills').find((b) => b.id === 'b-power').status).toBe('pending')
  })

  it('marking a task done removes it and lowers the Tasks today card', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })
    const statValue = () => screen.getByText('Tasks today').closest('.stat-card').querySelector('.sr-only').textContent
    expect(statValue()).toBe('1')

    await user.click(within(panel()).getByRole('button', { name: 'Mark done: Buy groceries' }))
    expect(rowTitles()).not.toContain('Buy groceries')
    expect(readStored('lifesync_tasks').find((t) => t.id === 't-groceries').completed).toBe(true)
    expect(statValue()).toBe('0')
  })

  it('documents get a snooze but no "mark done" button', async () => {
    renderApp('/')
    await screen.findByRole('region', { name: /needs attention/i })
    await user.click(tab(/^overdue/i))

    const row = within(panel()).getByText('Insurance (Asha Verma)').closest('li')
    expect(within(row).queryByRole('button', { name: /mark/i })).not.toBeInTheDocument()
    expect(within(row).getByRole('combobox', { name: /snooze duration/i })).toBeInTheDocument()
  })

  it('leaves out reminders snoozed earlier, and brings back ones whose snooze has ended', async () => {
    renderApp('/', {
      storage: storageFixture({ lifesync_snoozes: { 'bill-b-power': '2026-11-27', 'task-t-groceries': '2026-11-24' } }),
    })
    await screen.findByRole('region', { name: /needs attention/i })
    expect(rowTitles()).not.toContain('Electricity bill') // still snoozed until the 27th
    expect(rowTitles()).toContain('Buy groceries') // its snooze ended today
    // the ended snooze is cleaned up from storage, the active one is kept
    await waitFor(() => expect(readStored('lifesync_snoozes')).toEqual({ 'bill-b-power': '2026-11-27' }))
  })
})
