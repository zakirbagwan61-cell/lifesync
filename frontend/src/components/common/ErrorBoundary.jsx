import { Component } from 'react'

// If any page crashes while drawing (for example because saved data is corrupted),
// show a friendly screen instead of a blank white page.
// Error boundaries must be class components; this is the only one in the app.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('LifeSync crashed:', error)
  }

  // Delete everything LifeSync saved in the browser, then reload with fresh sample data.
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

    return (
      <div className="error-screen">
        <div className="empty-state">
          <h3>Something went wrong</h3>
          <p>Try reloading the page. If it keeps happening, reset the saved data.</p>
          <div className="form-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <button className="btn-secondary" onClick={this.resetData}>
              Reset saved data
            </button>
          </div>
        </div>
      </div>
    )
  }
}