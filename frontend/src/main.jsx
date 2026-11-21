import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ConfirmProvider } from './context/ConfirmContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import App from './App'
import './styles/index.css'
import './styles/components.css'

// ErrorBoundary catches crashes, BrowserRouter enables routing,
// AppProvider shares app data, ConfirmProvider powers the "Are you sure?" popups.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)