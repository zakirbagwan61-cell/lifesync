// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SaveWarning from './SaveWarning'
import { freezeToday, renderApp } from '../../test/render'
import { reportSaveResult, resetSaveStatus } from '../../utils/storage'

const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError', code: 22 })
const denied = () => Object.assign(new Error('denied'), { name: 'SecurityError', code: 18 })

beforeEach(() => resetSaveStatus())
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('SaveWarning', () => {
  it('shows nothing while saving works', () => {
    render(<SaveWarning />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('tells the user when browser storage is full, and what to do', () => {
    render(<SaveWarning />)
    act(() => reportSaveResult('lifesync_bills', quota()))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/latest changes are not being saved/i)
    expect(alert).toHaveTextContent(/storage is full/i)
    expect(alert).toHaveTextContent(/lost if you reload or close/i)
  })

  it('explains blocked storage in its own words', () => {
    render(<SaveWarning />)
    act(() => reportSaveResult('lifesync_bills', denied()))
    expect(screen.getByRole('alert')).toHaveTextContent(/blocking saved data.*private browsing/i)
  })

  it('goes away by itself when saving works again', () => {
    render(<SaveWarning />)
    act(() => reportSaveResult('lifesync_bills', quota()))
    act(() => reportSaveResult('lifesync_bills', null))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('can be dismissed, stays away for the same problem, and returns for a new one', async () => {
    const user = userEvent.setup()
    render(<SaveWarning />)
    act(() => reportSaveResult('lifesync_bills', quota()))
    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    act(() => reportSaveResult('lifesync_bills', quota())) // same problem again: still dismissed
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    act(() => reportSaveResult('lifesync_tasks', quota())) // a different list fails: worth showing again
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

describe('in the app', () => {
  it('shows the notice when a change cannot be saved, and the change still appears', async () => {
    freezeToday()
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderApp('/tasks')
    await screen.findByRole('heading', { level: 1, name: 'Tasks & Appointments' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    // from here on the browser refuses every save
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota()
    })
    await user.click(screen.getByRole('button', { name: 'Quick Add' }))
    const dialog = await screen.findByRole('dialog', { name: 'Quick Add' })
    await user.click(within(dialog).getByRole('button', { name: 'Task' }))
    await user.type(within(dialog).getByLabelText(/^task/i), 'Call the bank')
    await user.selectOptions(within(dialog).getByLabelText(/priority/i), 'Low')
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/not being saved/i)
    expect(await screen.findByText('Call the bank')).toBeInTheDocument() // still on screen
  })
})
