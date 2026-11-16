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
- [ ] `Modal`, `PageHeader`, `EmptyState`, `StatCard`
- [ ] `StatusBadge` (overdue, due soon, paid, pending, expired, valid)
- [ ] `ItemForm` driven by a field-config array (text, number, date, select, checkbox)
- [ ] Form validation (required fields, valid dates)

**Done when:** a demo modal with a form opens, validates and returns values.

## Phase 3: Bills & Payments
**Goal:** the first full module.
- [ ] Bills context state and CRUD actions
- [ ] Bills page: list, add, edit and delete modals
- [ ] Categories: electricity, mobile, internet, rent, other
- [ ] Mark paid, which moves the bill into payment history
- [ ] Monthly recurring bills: marking paid creates next month's bill
- [ ] Filters by status and category
- [ ] Seed sample data on first load

**Done when:** bills persist after refresh and the recurring flow works.

## Phase 4: Documents Manager
- [ ] Documents state and CRUD
- [ ] Types: Aadhaar, PAN, Passport, Driving Licence, Insurance, Other
- [ ] Fields: number, issue date, expiry date, notes
- [ ] Expiry status: valid, expiring within 60 days, expired
- [ ] Card grid layout and expiry alert banner

## Phase 5: Subscriptions
- [ ] Subscriptions state and CRUD
- [ ] Fields: name, cost, monthly or yearly cycle, next renewal date, auto-renew toggle
- [ ] Totals: monthly spend, yearly spend, normalized per-month cost
- [ ] Renewal-soon indicator

## Phase 6: Tasks & Appointments
- [ ] Tasks: title, priority, deadline, complete toggle
- [ ] Appointments: title, date, time, location
- [ ] Tabs for Tasks and Appointments, with pending and completed counts
- [ ] Sort and filter by priority and date

## Phase 7: Dashboard, Reminders, Activity
**Goal:** connect all modules.
- [ ] Activity log: every add, edit, delete, payment and completion is recorded from context actions
- [ ] Activity page with type filter and clear history
- [ ] Reminders derived from bills, documents, subscriptions and appointments
- [ ] Reminders tabs (Upcoming, Overdue, Completed, Snoozed), plus snooze for 1 day or 1 week
- [ ] Dashboard: stat cards, upcoming payments, expiry alerts, today's tasks, recent activity
- [ ] Unified timeline (next 30 days)

## Phase 8: Calendar, Search, Quick Add
- [ ] Calendar month and week views, colored event dots by type
- [ ] Day click shows that day's events
- [ ] Global search in the topbar and a Search results page with type filter
- [ ] Quick Add modal in the topbar (choose a type, then a short form)
- [ ] Smart priority indicators used consistently across the app

## Phase 9: Polish & hardening
- [ ] Full responsive pass (desktop, tablet, mobile)
- [ ] Empty, loading and error states
- [ ] Accessibility (labels, focus, keyboard-closable modals)
- [ ] Beginner-friendly code comments on key logic
- [ ] "Reset demo data" option, README

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
| 2 | Shared UI | Not started |
| 3 | Bills | Not started |
| 4 | Documents | Not started |
| 5 | Subscriptions | Not started |
| 6 | Tasks & Appointments | Not started |
| 7 | Dashboard, Reminders, Activity | Not started |
| 8 | Calendar, Search, Quick Add | Not started |
| 9 | Polish | Not started |
| 10 | Backend integration | Not started |
