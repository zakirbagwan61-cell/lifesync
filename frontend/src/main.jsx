import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import App from './App'
import './styles/index.css'
import './styles/components.css'
import './styles/charts.css'
import './styles/insights.css'
import './styles/feedback.css'

// ErrorBoundary catches crashes, BrowserRouter enables routing,
// AppProvider shares app data, ConfirmProvider powers the "Are you sure?" popups,
// ToastProvider powers the small "Undo" messages.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <ConfirmProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ConfirmProvider>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)