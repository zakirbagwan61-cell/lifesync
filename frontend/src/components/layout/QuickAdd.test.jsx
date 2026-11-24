// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { freezeToday, renderApp } from '../../test/render'
import { readStored } from '../../test/fixtures'

// Quick Add, opened from the top bar like a real user would, on top of fixed data (today = 24 Nov 2026).
let user

const openQuickAdd = async () => {
  await user.click(screen.getByRole('button', { name: 'Quick Add' }))
  return screen.findByRole('dialog', { name: 'Quick Add' })
}
const chooseType = (dialog, name) => user.click(within(dialog).getByRole('button', { name }))
const field = (dialog, label) => within(dialog).getByLabelText(label)

beforeEach(() => {
  freezeToday()
  user = userEvent.setup()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Quick Add', () => {
  it('opens as a labelled dialog with focus inside, and today as the default date', async () => {
    renderApp('/')
    const dialog = await openQuickAdd()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toContainElement(document.activeElement)
    expect(field(dialog, /due date/i)).toHaveValue('2026-11-24')
    expect(within(dialog).getByRole('button', { name: 'Add bill' })).toBeInTheDocument()
  })

  it('shows every missing required field, marks them invalid and focuses the first', async () => {
    renderApp('/')
    const dialog = await openQuickAdd()
    await user.click(within(dialog).getByRole('button', { name: 'Add bill' }))

    expect(within(dialog).getByText('Bill name is required')).toBeInTheDocument()
    expect(within(dialog).getByText('Category is required')).toBeInTheDocument()
    expect(within(dialog).getByText(/amount.*is required/i)).toBeInTheDocument()
    expect(field(dialog, /bill name/i)).toHaveAttribute('aria-invalid', 'true')
    expect(field(dialog, /bill name/i)).toHaveFocus()
    expect(readStored('lifesync_bills')).toHaveLength(4) // nothing was saved
  })

  it('rejects a zero amount with a clear message', async () => {
    renderApp('/')
    const dialog = await openQuickAdd()
    await user.type(field(dialog, /bill name/i), 'Gym fees')
    await user.selectOptions(field(dialog, /category/i), 'Other')
    await user.type(field(dialog, /amount/i), '0')
    await user.click(within(dialog).getByRole('button', { name: 'Add bill' }))
    expect(within(dialog).getByText('Amount must be greater than 0')).toBeInTheDocument()
  })

  it('saves a valid bill, closes, opens the Bills page and logs the activity', async () => {
    renderApp('/')
    const dialog = await openQuickAdd()
    await user.type(field(dialog, /bill name/i), '  Gym fees  ')
    await user.selectOptions(field(dialog, /category/i), 'Other')
    await user.type(field(dialog, /amount/i), '900')
    await user.click(within(dialog).getByRole('button', { name: 'Add bill' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByTestId('location')).toHaveTextContent('/bills')
    expect(await screen.findByText('Gym fees')).toBeInTheDocument() // trimmed, and listed on the page

    const saved = readStored('lifesync_bills').find((b) => b.title === 'Gym fees')
    expect(saved).toMatchObject({ amount: 900, category: 'Other', dueDate: '2026-11-24', status: 'pending' })
    expect(readStored('lifesync_activity')[0]).toMatchObject({ type: 'bill', action: 'added', title: 'Gym fees', itemId: saved.id })
  })

  describe('switching type keeps what was typed', () => {
    it('carries the name, amount and date to the next type', async () => {
      renderApp('/')
      const dialog = await openQuickAdd()
      await user.type(field(dialog, /bill name/i), 'Gym fees')
      await user.type(field(dialog, /amount/i), '900')
      await user.clear(field(dialog, /due date/i))
      await user.type(field(dialog, /due date/i), '2026-12-09')

      await chooseType(dialog, 'Subscription')
      expect(field(dialog, /service name/i)).toHaveValue('Gym fees')
      expect(field(dialog, /cost/i)).toHaveValue(900)
      expect(field(dialog, /next renewal date/i)).toHaveValue('2026-12-09')
      expect(within(dialog).getByRole('status')).toHaveTextContent(/your entries were kept/i)

      await chooseType(dialog, 'Task')
      expect(field(dialog, /task/i)).toHaveValue('Gym fees')
      expect(field(dialog, /deadline/i)).toHaveValue('2026-12-09')
    })

    it('remembers an amount through a type that has no amount field', async () => {
      renderApp('/')
      const dialog = await openQuickAdd()
      await user.type(field(dialog, /bill name/i), 'Gym fees')
      await user.type(field(dialog, /amount/i), '900')
      await chooseType(dialog, 'Task') // no amount here
      await chooseType(dialog, 'Subscription')
      expect(field(dialog, /cost/i)).toHaveValue(900)
    })

    it('restores a type\'s own entries when coming back to it', async () => {
      renderApp('/')
      const dialog = await openQuickAdd()
      await chooseType(dialog, 'Task')
      await user.type(field(dialog, /task/i), 'Pay electricity')
      await user.selectOptions(field(dialog, /priority/i), 'High')

      await chooseType(dialog, 'Appointment')
      await chooseType(dialog, 'Task')
      expect(field(dialog, /^task/i)).toHaveValue('Pay electricity')
      expect(field(dialog, /priority/i)).toHaveValue('High')
    })

    it('does not carry values into types that cannot use them', async () => {
      renderApp('/')
      const dialog = await openQuickAdd()
      await user.type(field(dialog, /bill name/i), 'Gym fees')
      await chooseType(dialog, 'Document')
      expect(field(dialog, /holder name/i)).toHaveValue('')
      expect(field(dialog, /document number/i)).toHaveValue('')
    })

    it('a carried-over form saves what is on screen', async () => {
      renderApp('/')
      const dialog = await openQuickAdd()
      await user.type(field(dialog, /bill name/i), 'Gym fees')
      await user.type(field(dialog, /amount/i), '900')
      await chooseType(dialog, 'Subscription')
      await user.selectOptions(field(dialog, /billing cycle/i), 'Monthly')
      await user.click(within(dialog).getByRole('button', { name: 'Add subscription' }))

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/subscriptions'))
      expect(readStored('lifesync_subscriptions').find((s) => s.name === 'Gym fees')).toMatchObject({ cost: 900, cycle: 'Monthly', nextRenewal: '2026-11-24' })
    })
  })

  describe('closing', () => {
    it('closes straight away when nothing was typed', async () => {
      renderApp('/')
      await openQuickAdd()
      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('clicking the dark backdrop closes it, but clicking inside the dialog does not', async () => {
      renderApp('/')
      const dialog = await openQuickAdd()
      await user.click(within(dialog).getByRole('heading', { name: 'Quick Add' }))
      await user.click(field(dialog, /bill name/i))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(dialog.parentElement) // the backdrop around the dialog
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('asks before throwing typed text away, even after switching type, and Keep editing keeps it', async () => {
      renderApp('/')
      const dialog = await openQuickAdd()
      await user.type(field(dialog, /bill name/i), 'Gym fees')
      await chooseType(dialog, 'Task') // the text is carried across, still unsaved

      await user.keyboard('{Escape}')
      expect(await screen.findByText(/discard unsaved changes/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /keep editing/i }))
      expect(field(screen.getByRole('dialog'), /task/i)).toHaveValue('Gym fees')
    })

    it('Discard closes it, and the next time it opens it is blank again', async () => {
      renderApp('/')
      const quickAddButton = screen.getByRole('button', { name: 'Quick Add' })
      const dialog = await openQuickAdd()
      await user.type(field(dialog, /bill name/i), 'Gym fees')
      await user.keyboard('{Escape}')
      await user.click(await screen.findByRole('button', { name: /discard changes/i }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(quickAddButton).toHaveFocus() // focus goes back to where it was

      const again = await openQuickAdd()
      expect(field(again, /bill name/i)).toHaveValue('')
      expect(within(again).queryByRole('status')).not.toBeInTheDocument()
    })

    it('keeps Tab focus inside the dialog', async () => {
      renderApp('/')
      const dialog = await openQuickAdd()
      within(dialog).getByRole('button', { name: 'Add bill' }).focus()
      await user.tab() // from the last button, focus wraps round instead of leaving the dialog
      expect(dialog).toContainElement(document.activeElement)
      await user.tab({ shift: true })
      expect(dialog).toContainElement(document.activeElement)
    })
  })
})
