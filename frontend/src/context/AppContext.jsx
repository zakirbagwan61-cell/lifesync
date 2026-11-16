import { createContext, useContext } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import { generateId, todayString, addDays, addMonths } from '../utils/helpers'

// Context = one shared store that every page can read from.
// Phase 3 added bills. Phase 4 adds documents.
const AppContext = createContext(null)

// Sample bills shown on the very first visit, so the app doesn't look empty.
// Dates are relative to today so the demo always looks realistic.
function createSeedBills() {
  const today = todayString()
  return [
    { id: generateId(), title: 'Electricity bill', category: 'Electricity', amount: 1850, dueDate: addDays(today, 3), recurring: true, status: 'pending', paidAt: null },
    { id: generateId(), title: 'Mobile recharge', category: 'Mobile', amount: 399, dueDate: addDays(today, -2), recurring: true, status: 'pending', paidAt: null },
    { id: generateId(), title: 'Broadband', category: 'Internet', amount: 999, dueDate: addDays(today, 12), recurring: true, status: 'pending', paidAt: null },
    { id: generateId(), title: 'House rent', category: 'Rent', amount: 15000, dueDate: addDays(today, 20), recurring: true, status: 'pending', paidAt: null },
    { id: generateId(), title: 'Water bill', category: 'Other', amount: 320, dueDate: addDays(today, -20), recurring: false, status: 'paid', paidAt: addDays(today, -21) },
  ]
}

// Sample documents (the numbers are fake). expiryDate is empty for documents that never expire.
function createSeedDocuments() {
  const today = todayString()
  return [
    { id: generateId(), type: 'Aadhaar', holder: 'Your Name', number: 'XXXX XXXX 1234', issueDate: '2018-05-10', expiryDate: '', notes: '' },
    { id: generateId(), type: 'PAN', holder: 'Your Name', number: 'ABCDE1234F', issueDate: '2017-03-02', expiryDate: '', notes: '' },
    { id: generateId(), type: 'Passport', holder: 'Your Name', number: 'P1234567', issueDate: '2021-08-15', expiryDate: addDays(today, 400), notes: 'Renew 6 months before expiry' },
    { id: generateId(), type: 'Driving Licence', holder: 'Your Name', number: 'DL-0420110012345', issueDate: '2016-01-20', expiryDate: addDays(today, 45), notes: '' },
    { id: generateId(), type: 'Insurance', holder: 'Your Name', number: 'POL-998877', issueDate: '2025-01-01', expiryDate: addDays(today, -10), notes: 'Health insurance' },
  ]
}

export function AppProvider({ children }) {
  const [userName, setUserName] = useLocalStorage('lifesync_user', 'Friend')
  const [bills, setBills] = useLocalStorage('lifesync_bills', createSeedBills())
  const [documents, setDocuments] = useLocalStorage('lifesync_documents', createSeedDocuments())

  // ----- Bill actions -----
  // Each action uses setBills(prev => ...) so it always works on the latest list.

  const addBill = (data) =>
    setBills((prev) => [...prev, { ...data, id: generateId(), status: 'pending', paidAt: null }])

  const updateBill = (id, changes) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)))

  const deleteBill = (id) => setBills((prev) => prev.filter((b) => b.id !== id))

  // Mark a bill paid. If it repeats monthly, also create next month's bill.
  const markBillPaid = (id) =>
    setBills((prev) => {
      const bill = prev.find((b) => b.id === id)
      if (!bill || bill.status === 'paid') return prev

      const updated = prev.map((b) =>
        b.id === id ? { ...b, status: 'paid', paidAt: todayString() } : b
      )

      if (bill.recurring) {
        updated.push({
          ...bill,
          id: generateId(),
          dueDate: addMonths(bill.dueDate, 1),
          status: 'pending',
          paidAt: null,
        })
      }
      return updated
    })

  // ----- Document actions -----
  const addDocument = (data) =>
    setDocuments((prev) => [...prev, { ...data, id: generateId() }])

  const updateDocument = (id, changes) =>
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d)))

  const deleteDocument = (id) => setDocuments((prev) => prev.filter((d) => d.id !== id))

  const value = {
    userName,
    setUserName,
    bills,
    addBill,
    updateBill,
    deleteBill,
    markBillPaid,
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Custom hook so pages can write: const { bills } = useApp()
export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}