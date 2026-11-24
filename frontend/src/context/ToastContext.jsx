import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// A small message at the bottom of the screen, with an optional Undo button.
//   const toast = useToast()
//   toast({ message: 'Bill marked as paid', onAction: () => undoIt() })
// Only one toast shows at a time; a new one replaces the old one.
// The message is announced to screen readers (aria-live).
const ToastContext = createContext(null)

const DURATION = 7000 // long enough to read the message and press Undo

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const clearTimer = () => window.clearTimeout(timer.current)
  const startTimer = (ms) => {
    clearTimer()
    timer.current = window.setTimeout(() => setToast(null), ms)
  }

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const show = useCallback(({ message, actionLabel = 'Undo', onAction }) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now() + Math.random(), message, actionLabel, onAction })
    timer.current = window.setTimeout(() => setToast(null), DURATION)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const runAction = () => {
    toast?.onAction?.()
    dismiss()
  }

  return (
    <ToastContext.Provider value={show}>
      {children}

      {/* Always in the page, so screen readers pick up new messages */}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div
            className="toast"
            key={toast.id}
            onMouseEnter={clearTimer} // do not disappear while the pointer is on it
            onMouseLeave={() => startTimer(3000)}
            onFocus={clearTimer}
            onBlur={() => startTimer(3000)}
          >
            <span className="toast-message">{toast.message}</span>
            {toast.onAction && (
              <button type="button" className="toast-action" onClick={runAction}>
                {toast.actionLabel}
              </button>
            )}
            <button type="button" className="toast-close" onClick={dismiss} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
