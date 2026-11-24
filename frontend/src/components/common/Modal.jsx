import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'

// Everything inside a dialog that a keyboard user can Tab to.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Lets a form inside a Modal say "I have unsaved changes", so the Modal can ask
// before closing. Forms call useModalDirty(true/false); outside a Modal it does nothing.
const ModalContext = createContext(null)

export function useModalDirty(dirty) {
  const setDirty = useContext(ModalContext)?.setDirty
  useEffect(() => {
    if (!setDirty) return undefined
    setDirty(dirty)
    return () => setDirty(false)
  }, [dirty, setDirty])
}

// A popup dialog. The parent decides when it is open (`isOpen`) and what to do on close.
//   <Modal isOpen={open} title="Add bill" onClose={() => setOpen(false)}> ...form... </Modal>
//
// Keyboard and screen reader behaviour:
//  - focus moves into the dialog on open, is kept inside it while Tab is pressed,
//    and returns to the button that opened it on close
//  - Escape, the X button and a click on the dark backdrop all close it the same way;
//    if the form has unsaved changes they ask "Discard changes?" first
export default function Modal({ isOpen, title, onClose, children }) {
  const dialogRef = useRef(null)
  const keepEditingRef = useRef(null)
  const [dirty, setDirty] = useState(false)
  const [askDiscard, setAskDiscard] = useState(false)

  // Handlers registered once read the latest values from these refs.
  const latest = useRef({})
  latest.current = { dirty, askDiscard, onClose }
  const focusBeforePrompt = useRef(null)

  const contextValue = useMemo(() => ({ setDirty }), [])

  // Close request from Escape, the X button or the backdrop.
  const requestClose = () => {
    const state = latest.current
    if (state.askDiscard) {
      setAskDiscard(false) // Escape on the prompt means "keep editing"
      return
    }
    if (state.dirty) {
      focusBeforePrompt.current = document.activeElement
      setAskDiscard(true)
      return
    }
    state.onClose()
  }
  const requestCloseRef = useRef(requestClose)
  requestCloseRef.current = requestClose

  // Escape key
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKey = (e) => {
      if (e.key === 'Escape') requestCloseRef.current()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey) // cleanup
  }, [isOpen])

  // Move focus into the dialog when it opens and back to where it was when it closes.
  // If that element is gone (for example a deleted row), fall back to the page heading.
  useEffect(() => {
    if (!isOpen) return undefined
    const previouslyFocused = document.activeElement
    dialogRef.current?.focus()
    return () => {
      if (previouslyFocused && previouslyFocused !== document.body && previouslyFocused.isConnected) {
        previouslyFocused.focus?.()
      } else {
        const heading = document.querySelector('main h1')
        heading?.setAttribute('tabindex', '-1')
        heading?.focus()
      }
    }
  }, [isOpen])

  // A closed dialog forgets its state.
  useEffect(() => {
    if (!isOpen) {
      setDirty(false)
      setAskDiscard(false)
    }
  }, [isOpen])

  // The discard prompt takes focus on its safe button; "keep editing" puts focus back.
  useEffect(() => {
    if (askDiscard) {
      keepEditingRef.current?.focus()
    } else if (isOpen && focusBeforePrompt.current) {
      const target = focusBeforePrompt.current
      focusBeforePrompt.current = null
      if (target.isConnected) target.focus?.()
    }
  }, [askDiscard, isOpen])

  // Keep Tab and Shift+Tab inside the dialog.
  const trapTab = (e) => {
    if (e.key !== 'Tab') return
    const dialog = dialogRef.current
    const nodes = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
    if (nodes.length === 0) {
      e.preventDefault()
      dialog.focus()
      return
    }
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === dialog)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!isOpen) return null

  return (
    // Clicking the dark backdrop asks to close; clicking inside the dialog does not.
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the dialog container keeps Tab focus inside it */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={trapTab}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {/* The form stays mounted (only hidden) while the prompt is shown, so nothing typed is lost. */}
          <ModalContext.Provider value={contextValue}>
            <div hidden={askDiscard}>{children}</div>
          </ModalContext.Provider>

          {askDiscard && (
            <div className="discard-prompt" role="alertdialog" aria-label="Discard unsaved changes?">
              <h3>Discard unsaved changes?</h3>
              <p>You have typed something that has not been saved. If you close now, it will be lost.</p>
              <div className="form-actions">
                <button
                  type="button"
                  ref={keepEditingRef}
                  className="btn-secondary"
                  onClick={() => setAskDiscard(false)}
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  className="btn-danger btn-danger-fill"
                  onClick={() => latest.current.onClose()}
                >
                  Discard changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
