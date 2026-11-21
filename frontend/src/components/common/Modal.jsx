import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// A popup dialog. The parent decides when it is open (`isOpen`) and what to do on close.
//   <Modal isOpen={open} title="Add bill" onClose={() => setOpen(false)}> ...form... </Modal>
export default function Modal({ isOpen, title, onClose, children }) {
  const dialogRef = useRef(null)

  // Close the modal when the user presses the Escape key.
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey) // cleanup
  }, [isOpen, onClose])

  // Accessibility: move keyboard focus into the dialog when it opens,
  // and return it to the button that opened it when it closes.
  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement
    dialogRef.current?.focus()
    return () => previouslyFocused?.focus?.()
  }, [isOpen])

  if (!isOpen) return null

  return (
    // Clicking the dark backdrop closes the modal; clicking inside it does not.
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}