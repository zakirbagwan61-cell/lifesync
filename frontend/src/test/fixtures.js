// Realistic, fixed test data for the component and page tests.
// "Today" in these tests is Tuesday 24 November 2026 (see FIXED_NOW). Everything below is written
// relative to that day, so the expected counts never change.
export const TODAY = '2026-11-24'
export const FIXED_NOW = new Date(2026, 10, 24, 10, 0, 0)

export const bills = [
  { id: 'b-rent', title: 'House rent', category: 'Rent', amount: 15000, dueDate: '2026-11-28', status: 'pending', paidAt: null, recurring: true },
  { id: 'b-power', title: 'Electricity bill', category: 'Electricity', amount: 1850, dueDate: TODAY, status: 'pending', paidAt: null, recurring: false },
  { id: 'b-mobile', title: 'Mobile recharge', category: 'Mobile', amount: 399, dueDate: '2026-11-20', status: 'pending', paidAt: null, recurring: false },
  { id: 'b-water', title: 'Water bill', category: 'Other', amount: 420, dueDate: '2026-11-05', status: 'paid', paidAt: '2026-11-10', recurring: false },
]

export const documents = [
  { id: 'd-passport', type: 'Passport', holder: 'Asha Verma', number: 'P1234567', issueDate: '2020-01-09', expiryDate: '2027-01-08', notes: 'Renew early' },
  { id: 'd-pan', type: 'PAN', holder: 'Asha Verma', number: 'ABCDE1234F', issueDate: '2015-03-01', expiryDate: '', notes: '' },
  { id: 'd-insurance', type: 'Insurance', holder: 'Asha Verma', number: 'POL-998877', issueDate: '2025-11-14', expiryDate: '2026-11-14', notes: 'Health insurance' },
]

export const subscriptions = [
  { id: 's-netflix', name: 'Netflix', cost: 649, cycle: 'Monthly', nextRenewal: '2026-11-26', autoRenew: true },
  { id: 's-prime', name: 'Amazon Prime', cost: 1499, cycle: 'Yearly', nextRenewal: '2027-06-01', autoRenew: false },
]

export const tasks = [
  { id: 't-groceries', title: 'Buy groceries', priority: 'Medium', deadline: TODAY, completed: false, completedAt: null },
  { id: 't-agent', title: 'Call insurance agent', priority: 'High', deadline: '2026-11-22', completed: false, completedAt: null },
  { id: 't-fees', title: 'Pay school fees', priority: 'High', deadline: '2026-11-30', completed: false, completedAt: null },
  { id: 't-done', title: 'Book flight tickets', priority: 'Low', deadline: '2026-11-18', completed: true, completedAt: '2026-11-17' },
]

export const appointments = [
  { id: 'a-team', title: 'Team meeting', date: TODAY, time: '15:00', location: 'Google Meet', completed: false },
  { id: 'a-dentist', title: 'Dentist check-up', date: TODAY, time: '09:30', location: 'Smile Dental Clinic', completed: false },
  { id: 'a-car', title: 'Car service', date: '2026-12-03', time: '09:00', location: 'Service centre', completed: false },
]

export const activity = [
  { id: 'e1', type: 'bill', action: 'paid', title: 'Water bill', itemId: 'b-water', timestamp: new Date(2026, 10, 10, 18, 5).toISOString() },
  { id: 'e2', type: 'task', action: 'completed', title: 'Book flight tickets', itemId: 't-done', timestamp: new Date(2026, 10, 17, 9, 30).toISOString() },
]

// What the app would have saved in the browser. Written to localStorage before a test renders the app.
export function storageFixture(overrides = {}) {
  return {
    lifesync_bills: bills,
    lifesync_documents: documents,
    lifesync_subscriptions: subscriptions,
    lifesync_tasks: tasks,
    lifesync_appointments: appointments,
    lifesync_activity: activity,
    lifesync_snoozes: {},
    ...overrides,
  }
}

export function seedStorage(data = storageFixture()) {
  Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)))
}

export const readStored = (key) => JSON.parse(localStorage.getItem(key))
