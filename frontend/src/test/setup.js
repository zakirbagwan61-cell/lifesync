import { afterEach } from 'vitest'

// Runs before every test file. Plain Node tests (utilities) need nothing; tests that opt in to jsdom
// get the DOM matchers, automatic cleanup and the few browser features jsdom does not implement.
if (typeof document !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')
  const { cleanup } = await import('@testing-library/react')

  afterEach(() => {
    cleanup()
    localStorage.clear() // every test starts with empty storage, so no test depends on another
  })

  // Features the app uses that jsdom does not provide.
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.CSS ??= {}
  window.CSS.escape ??= (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)
  window.HTMLElement.prototype.scrollIntoView ??= function scrollIntoView() {}
  window.scrollTo = () => {}
}
