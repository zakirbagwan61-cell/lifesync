import { createContext, useContext, useRef, useState } from 'react'
import Modal from '../components/common/Modal'

// A nicer replacement for window.confirm().
// Any page can do:
//   const confirm = useConfirm()
//   if (await confirm({ title: 'Delete bill', message: 'Are you sure?' })) { ...delete... }
const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null) // null = popup closed
  const resolver = useRef(null) // remembers the promise to answer when the user clicks

  const confirm = (opts) =>
    new Promise((resolve) => {
      resolver.current = resolve
      setOptions(opts)
    })

  // Answer the waiting promise with true (confirmed) or false (cancelled), then close.
  const close = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Modal isOpen={!!options} title={options?.title || 'Are you sure?'} onClose={() => close(false)}>
        <p className="confirm-text">{options?.message}</p>
        <div className="form-actions form-actions-spaced">
          <button className="btn-secondary" onClick={() => close(false)}>
            Cancel
          </button>
          {/* variant "primary" is for safe, reversible confirmations (for example reopening a bill) */}
          <button
            className={options?.variant === 'primary' ? 'btn-primary' : 'btn-danger btn-danger-fill'}
            onClick={() => close(true)}
          >
            {options?.confirmLabel || 'Delete'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return confirm
}