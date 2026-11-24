import { Component, createRef } from 'react'

// If any page crashes while drawing (for example because saved data is corrupted),
// show a friendly screen instead of a blank white page.
// Error boundaries must be class components; this is the only one in the app.
//
// It is used twice:
//  - around the whole app (full screen), the last line of defence
//  - around the page content in AppLayout (`compact`): one broken page shows a message in place
//    while the sidebar and top bar keep working. `resetKey` (the route) clears the error when
//    the user navigates elsewhere.
export default class ErrorBoundary extends Component {
  state = { hasError: false, confirmingReset: false }
  keepRef = createRef() // the safe button on the confirmation: it gets focus first
  resetRef = createRef() // the "Reset saved data" button: focus returns here if the user backs out

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('LifeSync crashed:', error)
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.confirmingReset && !prevState.confirmingReset) this.keepRef.current?.focus()
    if (!this.state.confirmingReset && prevState.confirmingReset) this.resetRef.current?.focus()
    // Navigating to another page gives it a fresh chance to render
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, confirmingReset: false })
    }
  }

  // Delete everything LifeSync saved in the browser, then reload with fresh sample data.
  // Only runs after the user has confirmed on this screen.
  resetData = () => {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('lifesync_'))
        .forEach((key) => localStorage.removeItem(key))
    } catch {
      // ignore: if storage is blocked, reloading is all we can do
    }
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const compact = !!this.props.compact
    const wrapperClass = compact ? 'error-inline' : 'error-screen'

    // Step 2: nothing is deleted until the user confirms here.
    if (this.state.confirmingReset) {
      return (
        <div className={wrapperClass}>
          <div className="empty-state" role="alertdialog" aria-labelledby="reset-title" aria-describedby="reset-text">
            <h3 id="reset-title">Delete all saved data?</h3>
            <p id="reset-text">
              This permanently deletes every bill, document, subscription, task, appointment and the
              activity history stored in this browser, and restores the sample data. It cannot be undone.
              Your light/dark theme choice is kept.
            </p>
            <div className="form-actions form-actions-center">
              <button
                ref={this.keepRef}
                className="btn-secondary"
                onClick={() => this.setState({ confirmingReset: false })}
              >
                Keep my data
              </button>
              <button className="btn-danger btn-danger-fill" onClick={this.resetData}>
                Delete everything
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={wrapperClass}>
        <div className="empty-state" role={compact ? 'alert' : undefined}>
          <h3>{compact ? 'This page ran into a problem' : 'Something went wrong'}</h3>
          <p>
            {compact
              ? 'The rest of LifeSync still works. Try again, go back to the Dashboard, or reset the saved data if it keeps happening.'
              : 'Try reloading the page. If it keeps happening, reset the saved data.'}
          </p>
          <div className="form-actions form-actions-center form-actions-wrap">
            {compact ? (
              <>
                <button className="btn-primary" onClick={() => this.setState({ hasError: false })}>
                  Try again
                </button>
                <a className="btn-secondary" href="/">
                  Go to Dashboard
                </a>
              </>
            ) : (
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Reload page
              </button>
            )}
            <button ref={this.resetRef} className="btn-secondary" onClick={() => this.setState({ confirmingReset: true })}>
              Reset saved data
            </button>
          </div>
        </div>
      </div>
    )
  }
}
