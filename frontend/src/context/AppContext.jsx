import { createContext, useContext, useEffect } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import { generateId, todayString, addDays, addMonths } from '../utils/helpers'
import { reopenBillInList } from '../utils/bills'
import { isPlainObject, isRecordList, isText } from '../utils/storage'
import { MAX_ACTIVITY } from '../utils/activity'
import { pruneSnoozes } from '../utils/snoozes'

// Context = one shared store that every page can read from.
// Phase 3 added bills, 4 documents, 5 subscriptions, 6 tasks + appointments,
// 7 the activity log and reminder snoozes.
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

// Sample subscriptions. cycle is 'Monthly' or 'Yearly'.
function createSeedSubscriptions() {
  const today = todayString()
  return [
    { id: generateId(), name: 'Netflix', cost: 649, cycle: 'Monthly', nextRenewal: addDays(today, 5), autoRenew: true },
    { id: generateId(), name: 'Spotify', cost: 119, cycle: 'Monthly', nextRenewal: addDays(today, 14), autoRenew: true },
    { id: generateId(), name: 'YouTube Premium', cost: 1290, cycle: 'Yearly', nextRenewal: addDays(today, 120), autoRenew: true },
    { id: generateId(), name: 'Amazon Prime', cost: 1499, cycle: 'Yearly', nextRenewal: addDays(today, 200), autoRenew: false },
  ]
}

// Sample tasks. priority is 'High', 'Medium' or 'Low'.
function createSeedTasks() {
  const today = todayString()
  return [
    { id: generateId(), title: 'Call insurance agent', priority: 'High', deadline: addDays(today, -1), completed: false, completedAt: null },
    { id: generateId(), title: 'Pay school fees', priority: 'High', deadline: addDays(today, 1), completed: false, completedAt: null },
    { id: generateId(), title: 'Buy groceries', priority: 'Medium', deadline: today, completed: false, completedAt: null },
    { id: generateId(), title: 'Renew library card', priority: 'Low', deadline: addDays(today, 7), completed: false, completedAt: null },
    { id: generateId(), title: 'Submit tax documents', priority: 'High', deadline: addDays(today, -5), completed: true, completedAt: addDays(today, -6) },
  ]
}

// Sample appointments. time is 24-hour "HH:MM".
function createSeedAppointments() {
  const today = todayString()
  return [
    { id: generateId(), title: 'Team meeting', date: today, time: '15:00', location: 'Google Meet', completed: false },
    { id: generateId(), title: 'Dentist check-up', date: addDays(today, 2), time: '10:30', location: 'Smile Dental Clinic', completed: false },
    { id: generateId(), title: 'Car service', date: addDays(today, 9), time: '09:00', location: 'Service centre', completed: false },
    { id: generateId(), title: 'Parent-teacher meeting', date: addDays(today, -4), time: '11:00', location: 'School', completed: true },
  ]
}

// Short name used for a document in the activity log.
const docLabel = (d) => (d ? `${d.type} (${d.holder})` : 'Document')

export function AppProvider({ children }) {
  const [userName, setUserName] = useLocalStorage('lifesync_user', 'Friend', isText)
  const [bills, setBills, getBills] = useLocalStorage('lifesync_bills', createSeedBills(), isRecordList)
  const [documents, setDocuments, getDocuments] = useLocalStorage('lifesync_documents', createSeedDocuments(), isRecordList)
  const [subscriptions, setSubscriptions, getSubscriptions] = useLocalStorage('lifesync_subscriptions', createSeedSubscriptions(), isRecordList)
  const [tasks, setTasks, getTasks] = useLocalStorage('lifesync_tasks', createSeedTasks(), isRecordList)
  const [appointments, setAppointments, getAppointments] = useLocalStorage('lifesync_appointments', createSeedAppointments(), isRecordList)
  const [activity, setActivity] = useLocalStorage('lifesync_activity', [], isRecordList)
  const [snoozes, setSnoozes] = useLocalStorage('lifesync_snoozes', {}, isPlainObject)

  // Actions below look things up with getBills(), getTasks() and so on: those return the newest list even
  // when an action runs twice before React re-renders (a double click), so nothing is logged twice or wrongly.

  // ----- Activity log -----
  // type: bill | document | subscription | task | appointment
  // action: added | updated | deleted | paid | completed | reopened | renewed
  // Newest entry goes first; we keep only the latest MAX_ACTIVITY. `itemId` is the item the entry is
  // about, so the Activity page can link to it (older entries saved before this have none).
  const logActivity = (type, action, title, itemId) =>
    setActivity((prev) =>
      [{ id: generateId(), type, action, title, itemId, timestamp: new Date().toISOString() }, ...prev].slice(0, MAX_ACTIVITY)
    )

  const clearActivity = () => setActivity([])

  // Drop snoozes that have ended or whose item was deleted, so the saved list does not grow forever.
  // pruneSnoozes returns the same object when there is nothing to remove, so this does not loop.
  useEffect(() => {
    const pruned = pruneSnoozes(snoozes, { bills, documents, subscriptions, tasks, appointments })
    if (pruned !== snoozes) setSnoozes(pruned)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snoozes, bills, documents, subscriptions, tasks, appointments])

  // ----- Reminder snooze -----
  // Hide a reminder for a number of days. Stored as { reminderId: 'YYYY-MM-DD' }.
  const snoozeReminder = (reminderId, days) =>
    setSnoozes((prev) => ({ ...prev, [reminderId]: addDays(todayString(), days) }))

  const unsnoozeReminder = (reminderId) =>
    setSnoozes((prev) => {
      const next = { ...prev }
      delete next[reminderId]
      return next
    })

  // ----- Bill actions -----
  // Each action changes the list with setBills(prev => ...) and then logs what happened.

  const addBill = (data) => {
    const id = generateId()
    setBills((prev) => [...prev, { ...data, id, status: 'pending', paidAt: null }])
    logActivity('bill', 'added', data.title, id)
  }

  const updateBill = (id, changes) => {
    const bill = getBills().find((b) => b.id === id)
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)))
    logActivity('bill', 'updated', changes.title || bill?.title || 'Bill', id)
  }

  const deleteBill = (id) => {
    const bill = getBills().find((b) => b.id === id)
    setBills((prev) => prev.filter((b) => b.id !== id))
    logActivity('bill', 'deleted', bill?.title || 'Bill', id)
  }

  // Mark a bill paid. If it repeats monthly, also create next month's bill.
  const markBillPaid = (id) => {
    const bill = getBills().find((b) => b.id === id)
    if (!bill || bill.status === 'paid') return

    setBills((prev) => {
      const current = prev.find((b) => b.id === id)
      if (!current || current.status === 'paid') return prev

      const updated = prev.map((b) =>
        b.id === id ? { ...b, status: 'paid', paidAt: todayString() } : b
      )

      if (current.recurring) {
        updated.push({
          ...current,
          id: generateId(),
          dueDate: addMonths(current.dueDate, 1),
          status: 'pending',
          paidAt: null,
        })
      }
      return updated
    })
    logActivity('bill', 'paid', bill.title, id)
  }

  // Turn a paid bill back into a pending one ("Undo" after paying, or "Reopen" in payment history).
  // The list change is a pure function (utils/bills.js) that also removes the automatic next-month
  // copy of a recurring bill when it is still untouched.
  const reopenBill = (id) => {
    const bill = getBills().find((b) => b.id === id)
    setBills((prev) => reopenBillInList(prev, id))
    logActivity('bill', 'reopened', bill?.title || 'Bill', id)
  }

  // ----- Document actions -----
  const addDocument = (data) => {
    const id = generateId()
    setDocuments((prev) => [...prev, { ...data, id }])
    logActivity('document', 'added', docLabel(data), id)
  }

  const updateDocument = (id, changes) => {
    const doc = getDocuments().find((d) => d.id === id)
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d)))
    logActivity('document', 'updated', docLabel(doc ? { ...doc, ...changes } : changes), id)
  }

  const deleteDocument = (id) => {
    const doc = getDocuments().find((d) => d.id === id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    logActivity('document', 'deleted', docLabel(doc), id)
  }

  // ----- Subscription actions -----
  const addSubscription = (data) => {
    const id = generateId()
    setSubscriptions((prev) => [...prev, { ...data, id }])
    logActivity('subscription', 'added', data.name, id)
  }

  const updateSubscription = (id, changes) => {
    const sub = getSubscriptions().find((s) => s.id === id)
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)))
    logActivity('subscription', 'updated', changes.name || sub?.name || 'Subscription', id)
  }

  const deleteSubscription = (id) => {
    const sub = getSubscriptions().find((s) => s.id === id)
    setSubscriptions((prev) => prev.filter((s) => s.id !== id))
    logActivity('subscription', 'deleted', sub?.name || 'Subscription', id)
  }

  // Mark a subscription as renewed: move the renewal date forward by one billing cycle.
  const renewSubscription = (id) => {
    const sub = getSubscriptions().find((s) => s.id === id)
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, nextRenewal: addMonths(s.nextRenewal, s.cycle === 'Yearly' ? 12 : 1) }
          : s
      )
    )
    logActivity('subscription', 'renewed', sub?.name || 'Subscription', id)
  }

  // ----- Task actions -----
  const addTask = (data) => {
    const id = generateId()
    setTasks((prev) => [...prev, { ...data, id, completed: false, completedAt: null }])
    logActivity('task', 'added', data.title, id)
  }

  const updateTask = (id, changes) => {
    const task = getTasks().find((t) => t.id === id)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)))
    logActivity('task', 'updated', changes.title || task?.title || 'Task', id)
  }

  const deleteTask = (id) => {
    const task = getTasks().find((t) => t.id === id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
    logActivity('task', 'deleted', task?.title || 'Task', id)
  }

  // Flip a task between pending and completed.
  const toggleTask = (id) => {
    const task = getTasks().find((t) => t.id === id)
    if (!task) return
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: t.completed ? null : todayString() }
          : t
      )
    )
    logActivity('task', task.completed ? 'reopened' : 'completed', task.title, id)
  }

  // ----- Appointment actions -----
  const addAppointment = (data) => {
    const id = generateId()
    setAppointments((prev) => [...prev, { ...data, id, completed: false }])
    logActivity('appointment', 'added', data.title, id)
  }

  const updateAppointment = (id, changes) => {
    const appt = getAppointments().find((a) => a.id === id)
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)))
    logActivity('appointment', 'updated', changes.title || appt?.title || 'Appointment', id)
  }

  const deleteAppointment = (id) => {
    const appt = getAppointments().find((a) => a.id === id)
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    logActivity('appointment', 'deleted', appt?.title || 'Appointment', id)
  }

  const toggleAppointment = (id) => {
    const appt = getAppointments().find((a) => a.id === id)
    if (!appt) return
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)))
    logActivity('appointment', appt.completed ? 'reopened' : 'completed', appt.title, id)
  }



  // ----- Reset -----
  // Put the original sample data back everywhere and empty the log and snoozes.
  const resetAllData = () => {
    setBills(createSeedBills())
    setDocuments(createSeedDocuments())
    setSubscriptions(createSeedSubscriptions())
    setTasks(createSeedTasks())
    setAppointments(createSeedAppointments())
    setActivity([])
    setSnoozes({})
  }

  const value = {
    userName,
    setUserName,
    bills,
    addBill,
    updateBill,
    deleteBill,
    markBillPaid,
    reopenBill,
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    renewSubscription,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    toggleAppointment,
    activity,
    clearActivity,
    snoozes,
    snoozeReminder,
    unsnoozeReminder,
    resetAllData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Custom hook so pages can write: const { bills } = useApp()
export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}