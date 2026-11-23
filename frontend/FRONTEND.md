# LifeSync Frontend: Phase-wise Plan

**Stack:** React.js + Vite, JavaScript, CSS, React Router, Lucide React, Hooks + Context API.
**Data:** LocalStorage in early phases. From Phase 8 the Context calls the backend API instead.
**Rule:** one phase at a time. Each phase ends with a working, testable app. Frontend phase N pairs with backend phase N (see `../backend/BACKEND.md`).

---

## Folder structure (final)

```
frontend/
├── index.html
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx                 route table
    ├── context/AppContext.jsx  all data + actions (single source of truth)
    ├── hooks/useLocalStorage.js
    ├── utils/helpers.js        dates, currency, ids
    ├── components/
    │   ├── layout/             AppLayout, Sidebar, Topbar
    │   └── common/             Modal, StatusBadge, PageHeader, EmptyState, StatCard, ItemForm
    ├── pages/                  Dashboard, Bills, Documents, Subscriptions, Tasks,
    │                           Reminders, CalendarPage, Activity, Search
    └── styles/                 index.css, components.css
```

Files are created only in the phase that needs them.

---

## Phase 1: Foundation
**Goal:** a navigable app shell.
- [x] Scaffold Vite + React, install `react-router-dom` and `lucide-react`
- [x] CSS design tokens (colors, spacing, radius, shadows), base reset
- [x] `AppLayout`: sidebar, topbar, `<Outlet/>`
- [x] Routes for all pages with placeholder content
- [x] Responsive sidebar (hamburger drawer on mobile)
- [x] `useLocalStorage` hook
- [x] `AppContext` skeleton and `helpers.js` (date and currency helpers, id generator)

**Done when:** every sidebar link opens a page, and the layout works at desktop, tablet and mobile widths.

## Phase 2: Shared UI components
**Goal:** reusable building blocks, so later phases go fast.
- [x] `Modal`, `PageHeader`, `EmptyState`, `StatCard`
- [x] `StatusBadge` (overdue, due soon, paid, pending, expired, valid)
- [x] `ItemForm` driven by a field-config array (text, number, date, select, checkbox)
- [x] Form validation (required fields, valid dates)

**Done when:** a demo modal with a form opens, validates and returns values.

## Phase 3: Bills & Payments
**Goal:** the first full module.
- [x] Bills context state and CRUD actions
- [x] Bills page: list, add, edit and delete modals
- [x] Categories: electricity, mobile, internet, rent, other
- [x] Mark paid, which moves the bill into payment history
- [x] Monthly recurring bills: marking paid creates next month's bill
- [x] Filters by status and category
- [x] Seed sample data on first load

**Done when:** bills persist after refresh and the recurring flow works.

## Phase 4: Documents Manager
- [x] Documents state and CRUD
- [x] Types: Aadhaar, PAN, Passport, Driving Licence, Insurance, Other
- [x] Fields: number, issue date, expiry date, notes
- [x] Expiry status: valid, expiring within 60 days, expired
- [x] Card grid layout and expiry alert banner

## Phase 5: Subscriptions
- [x] Subscriptions state and CRUD
- [x] Fields: name, cost, monthly or yearly cycle, next renewal date, auto-renew toggle
- [x] Totals: monthly spend, yearly spend, normalized per-month cost
- [x] Renewal-soon indicator

## Phase 6: Tasks & Appointments
- [x] Tasks: title, priority, deadline, complete toggle
- [x] Appointments: title, date, time, location
- [x] Tabs for Tasks and Appointments, with pending and completed counts
- [x] Sort and filter by priority and date

## Phase 7: Dashboard, Reminders, Activity
**Goal:** connect all modules.
- [x] Activity log: every add, edit, delete, payment and completion is recorded from context actions
- [x] Activity page with type filter and clear history
- [x] Reminders derived from bills, documents, subscriptions and appointments
- [x] Reminders tabs (Upcoming, Overdue, Completed, Snoozed), plus snooze for 1 day or 1 week
- [x] Dashboard: stat cards, upcoming payments, expiry alerts, today's tasks, recent activity
- [x] Unified timeline (next 30 days)

## Phase 8: Calendar, Search, Quick Add
- [x] Calendar month and week views, colored event dots by type
- [x] Day click shows that day's events
- [x] Global search in the topbar and a Search results page with type filter
- [x] Quick Add modal in the topbar (choose a type, then a short form)
- [x] Smart priority indicators used consistently across the app

## Phase 9: Polish & hardening
- [x] Full responsive pass (desktop, tablet, mobile)
- [x] Empty, loading and error states
- [x] Accessibility (labels, focus, keyboard-closable modals)
- [x] Beginner-friendly code comments on key logic
- [x] "Reset demo data" option, README

## Phase 10: Backend integration (after backend Phase 2+)
- [ ] `src/api/` client (fetch wrapper with auth token)
- [ ] Login and Register pages, protected routes, auth context
- [ ] Replace localStorage calls in `AppContext` with API calls, one module at a time
- [ ] Loading and error handling for network calls
- [ ] Optional: one-time import of existing localStorage data to the server

---

## Phase / module status

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation | Done |
| 2 | Shared UI | Done |
| 3 | Bills | Done |
| 4 | Documents | Done |
| 5 | Subscriptions | Done |
| 6 | Tasks & Appointments | Done |
| 7 | Dashboard, Reminders, Activity | Done |
| 8 | Calendar, Search, Quick Add | Done |
| 9 | Polish | Done |
| 10 | Backend integration | Not started |
