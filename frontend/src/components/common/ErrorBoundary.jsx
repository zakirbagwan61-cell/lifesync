import { Component, createRef } from 'react'

// If any page crashes while drawing (for example because saved data is corrupted),
// show a friendly screen instead of a blank white page.
// Error boundaries must be class components; this is the only one in the app.
export default class ErrorBoundary extends Component {
  state = { hasError: false, confirmingReset: false }
  keepRef = createRef() // the safe button on the confirmation: it gets focus first
  resetRef = createRef() // the "Reset saved data" button: focus returns here if the user backs out

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.confirmingReset && !prevState.confirmingReset) this.keepRef.current?.focus()
    if (!this.state.confirmingReset && prevState.confirmingReset) this.resetRef.current?.focus()
  }

  componentDidCatch(error) {
    console.error('LifeSync crashed:', error)
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

    // Step 2: nothing is deleted until the user confirms here.
    if (this.state.confirmingReset) {
      return (
        <div className="error-screen">
          <div className="empty-state" role="alertdialog" aria-labelledby="reset-title" aria-describedby="reset-text">
            <h3 id="reset-title">Delete all saved data?</h3>
            <p id="reset-text">
              This permanently deletes every bill, document, subscription, task, appointment and the
              activity history stored in this browser, and restores the sample data. It cannot be undone.
              Your light/dark theme choice is kept.
            </p>
            <div className="form-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
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
      <div className="error-screen">
        <div className="empty-state">
          <h3>Something went wrong</h3>
          <p>Try reloading the page. If it keeps happening, reset the saved data.</p>
          <div className="form-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <button ref={this.resetRef} className="btn-secondary" onClick={() => this.setState({ confirmingReset: true })}>
              Reset saved data
            </button>
          </div>
        </div>
      </div>
    )
  }
}
