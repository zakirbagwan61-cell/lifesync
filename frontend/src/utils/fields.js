// Form field definitions used by Quick Add (the same ones the module pages use).

export const CATEGORIES = ['Electricity', 'Mobile', 'Internet', 'Rent', 'Other']
export const DOC_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Driving Licence', 'Insurance', 'Other']
export const CYCLES = ['Monthly', 'Yearly']
export const PRIORITIES = ['High', 'Medium', 'Low']

export const billFields = [
  { name: 'title', label: 'Bill name', type: 'text', required: true, maxLength: 80, placeholder: 'e.g. Electricity bill' },
  { name: 'category', label: 'Category', type: 'select', options: CATEGORIES, required: true },
  { name: 'amount', label: 'Amount (₹)', type: 'number', required: true, positive: true },
  { name: 'dueDate', label: 'Due date', type: 'date', required: true },
  { name: 'recurring', label: 'Repeats every month', type: 'checkbox' },
]

export const documentFields = [
  { name: 'type', label: 'Document type', type: 'select', options: DOC_TYPES, required: true },
  { name: 'holder', label: 'Holder name', type: 'text', required: true, maxLength: 60 },
  { name: 'number', label: 'Document number', type: 'text', required: true, maxLength: 40 },
  { name: 'issueDate', label: 'Issue date', type: 'date' },
  { name: 'expiryDate', label: 'Expiry date (leave empty if it never expires)', type: 'date', notBefore: 'issueDate' },
  { name: 'notes', label: 'Notes', type: 'textarea', maxLength: 500, placeholder: 'Optional' },
]

export const subscriptionFields = [
  { name: 'name', label: 'Service name', type: 'text', required: true, maxLength: 60, placeholder: 'e.g. Netflix' },
  { name: 'cost', label: 'Cost (₹)', type: 'number', required: true, positive: true },
  { name: 'cycle', label: 'Billing cycle', type: 'select', options: CYCLES, required: true },
  { name: 'nextRenewal', label: 'Next renewal date', type: 'date', required: true },
  { name: 'autoRenew', label: 'Auto-renew is on', type: 'checkbox' },
]

export const taskFields = [
  { name: 'title', label: 'Task', type: 'text', required: true, maxLength: 100, placeholder: 'e.g. Pay school fees' },
  { name: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, required: true },
  { name: 'deadline', label: 'Deadline', type: 'date', required: true },
]

export const appointmentFields = [
  { name: 'title', label: 'Appointment', type: 'text', required: true, maxLength: 100, placeholder: 'e.g. Dentist check-up' },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'time', label: 'Time', type: 'time', required: true },
  { name: 'location', label: 'Location', type: 'text', maxLength: 100, placeholder: 'Optional' },
]