import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import { AppProvider } from '../context/AppContext'
import { ConfirmProvider } from '../context/ConfirmContext'
import { ToastProvider } from '../context/ToastContext'
import App from '../App'
import { FIXED_NOW, seedStorage, storageFixture } from './fixtures'

// Shows the current address so a test can check where a click led.
function LocationProbe() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{pathname + search}</div>
}

// Pretend it is 24 Nov 2026, 10:00. Only Date is faked, so timers (debounce, animations) stay real.
export function freezeToday() {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FIXED_NOW)
}

// Render the whole app (layout, router, all providers) at an address, with fixed data saved in storage.
// The test's own localStorage is used (cleared after every test); the real app data is never touched.
export function renderApp(route = '/', { storage = storageFixture() } = {}) {
  seedStorage(storage)
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        <ConfirmProvider>
          <ToastProvider>
            <App />
            <LocationProbe />
          </ToastProvider>
        </ConfirmProvider>
      </AppProvider>
    </MemoryRouter>
  )
}
