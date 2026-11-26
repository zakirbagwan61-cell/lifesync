# LifeSync Frontend: Developer Guide

**Stack:** React 18 + Vite 8, JavaScript, plain CSS, React Router 7, Lucide React, Hooks + Context API.
**Data:** browser LocalStorage. **The backend has not been implemented**, and the app makes no API calls.

For a feature overview, see the [project README](../README.md).

- [Setup and scripts](#setup-and-scripts)
- [Folder structure](#folder-structure)
- [Architecture](#architecture)
- [Routing](#routing)
- [Context API](#context-api)
- [LocalStorage](#localstorage)
- [Dates, forms and reminders](#dates-forms-and-reminders)
- [Themes and styling](#themes-and-styling)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Linting, build and CI](#linting-build-and-ci)
- [Phase history and status](#phase-history-and-status)

---

## Setup and scripts

Requires Node.js 20.19 or later within 20.x, 22.12 or later within 22.x, or 24 and newer. The repository's `.nvmrc` selects Node 24.

```bash
cd frontend
npm ci
npm run dev
```

| Command | Runs | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Development server (usually http://localhost:5173) |
| `npm run build` | `vite build` | Production build in `dist/` |
| `npm run preview` | `vite preview` | Serve `dist/`; build first (usually http://localhost:4173) |
| `npm test` | `vitest run` | All tests, once |
| `npm run test:watch` | `vitest` | Tests in watch mode |
| `npm run lint` | `eslint .` | Lint the project |
| `npm run lint:fix` | `eslint . --fix` | Lint and apply automatic fixes |

---

## Folder structure

```
frontend/
├── index.html              page shell; applies the saved theme before the first paint
├── package.json
├── vite.config.js          Vite and Vitest settings
├── eslint.config.js
└── src/
    ├── main.jsx            entry point: providers and global styles
    ├── App.jsx             route table
    ├── context/            AppContext, ConfirmContext, ToastContext
    ├── pages/              Dashboard, Bills, Documents, Subscriptions, Tasks,
    │                       Reminders, CalendarPage, Activity, Search, NotFound
    ├── components/
    │   ├── layout/         AppLayout, Sidebar, Topbar, QuickAdd
    │   ├── common/         Modal, ItemForm, Tabs, PageHeader, EmptyState, StatCard,
    │   │                   StatusBadge, ErrorBoundary, SaveWarning
    │   ├── dashboard/      NeedsAttention
    │   ├── insights/       SmartInsights (spending, productivity, recommendations)
    │   └── charts/         SVG area, bar and donut charts, chart data functions
    ├── hooks/              storage, theme, dates, focus, accessibility and UI hooks
    ├── utils/              logic without UI: dates, reminders, search, insights,
    │                       validation, form fields, storage checks and more
    ├── styles/             index, components, charts, insights, feedback (CSS)
    └── test/               shared test setup, fixtures and helpers
```

Test files (`*.test.js` and `*.test.jsx`) sit next to the code they cover.

---

## Architecture

`main.jsx` wraps the app in this order:

```
StrictMode
└── ErrorBoundary          last line of defence: full-screen error message
    └── BrowserRouter      routing
        └── AppProvider    all app data and actions
            └── ConfirmProvider    "Are you sure?" dialogs
                └── ToastProvider  messages with Undo
                    └── App        route table
```

How data flows:

1. Pages read data and call actions through `useApp()`.
2. `AppContext` updates its state and records most changes in the activity log.
3. `useLocalStorage` saves each changed value to the browser.
4. Reminders, search results, insights and charts are **calculated** from that data by functions in `utils/` and `components/charts/chartUtils.js`. They are not stored.

`AppLayout` renders the sidebar, top bar, save warning, current page and Quick Add dialog. A second `ErrorBoundary` around the page lets the menu keep working if one page crashes; moving to another page clears the error.

---

## Routing

Declared in `App.jsx`. Every page is a child of the `AppLayout` route and appears in its `<Outlet />`.

| Path | Page |
|---|---|
| `/` | Dashboard |
| `/bills` | Bills & Payments |
| `/documents` | Documents |
| `/subscriptions` | Subscriptions |
| `/tasks` | Tasks & Appointments |
| `/reminders` | Reminders |
| `/calendar` | Calendar |
| `/activity` | Activity History |
| `/search?q=...` | Search results |
| `*` | Page not found |

- Import routing APIs from `react-router-dom`.
- **Links to one item** use `?focus=<id>`, for example `/bills?focus=<id>`. Appointments add `&tab=appointments`. The `useFocusItem` hook reveals, scrolls to and highlights the item, then removes those parameters. The item's element needs a `data-item-id` attribute.
- `useRouteAccessibility` sets the browser tab title and moves focus to the page heading after navigation. Add new routes to its title list.
- A new menu entry goes in the `sections` list in `Sidebar.jsx`.

---

## Context API

| Context | Hook | Provides |
|---|---|---|
| `AppContext` | `useApp()` | Data, and the actions that change it |
| `ConfirmContext` | `useConfirm()` | `await confirm({ title, message })` returns `true` or `false` |
| `ToastContext` | `useToast()` | A short message with an optional Undo action |

Each hook throws an error when used outside its provider.

`useApp()` exposes:

| Area | Data | Actions |
|---|---|---|
| User | `userName` | `setUserName` |
| Bills | `bills` | `addBill`, `updateBill`, `deleteBill`, `markBillPaid`, `reopenBill` |
| Documents | `documents` | `addDocument`, `updateDocument`, `deleteDocument` |
| Subscriptions | `subscriptions` | `addSubscription`, `updateSubscription`, `deleteSubscription`, `renewSubscription` |
| Tasks | `tasks` | `addTask`, `updateTask`, `deleteTask`, `toggleTask` |
| Appointments | `appointments` | `addAppointment`, `updateAppointment`, `deleteAppointment`, `toggleAppointment` |
| Activity | `activity` | `clearActivity` |
| Reminders | `snoozes` | `snoozeReminder`, `unsnoozeReminder` |
| Reset | | `resetAllData` |

Behaviour worth knowing:

- Paying a recurring bill creates next month's bill. Reopening it removes that copy only if it is unchanged.
- The activity log keeps the newest 200 entries.
- Snoozes that have ended, or whose item was deleted, are removed automatically.
- `userName` defaults to `Friend`. There is currently no screen for changing it.

---

## LocalStorage

The bills, documents, subscriptions, tasks, appointments and activity keys each hold a **list** of records with the fields shown.

| Key | Contents |
|---|---|
| `lifesync_user` | Name used in the Dashboard greeting |
| `lifesync_bills` | `{ id, title, category, amount, dueDate, recurring, status, paidAt }` |
| `lifesync_documents` | `{ id, type, holder, number, issueDate, expiryDate, notes }` |
| `lifesync_subscriptions` | `{ id, name, cost, cycle, nextRenewal, autoRenew }` |
| `lifesync_tasks` | `{ id, title, priority, deadline, completed, completedAt }` |
| `lifesync_appointments` | `{ id, title, date, time, location, completed }` |
| `lifesync_activity` | `{ id, type, action, title, itemId, timestamp }` |
| `lifesync_snoozes` | `{ "<kind>-<id>": "YYYY-MM-DD" }` |
| `lifesync-theme` | `light` or `dark` (note the hyphen) |
| `<key>_unreadable_backup` | Copy of a saved value that could not be read |

The data keys are stored as JSON, the theme as plain text and a backup as the original text, all **without encryption**.

`useLocalStorage(key, initialValue, isValid)` returns `[value, setValue, getValue]`:

- When nothing is saved yet, the initial value is used and saved (sample data for the item lists).
- Unreadable or wrongly shaped data is replaced by the initial value, after a backup copy is attempted.
- `getValue()` returns the newest value, even before React re-renders.
- Changes saved by another tab are picked up through the browser's `storage` event.
- If saving fails (storage full or blocked), the app keeps working in memory and `SaveWarning` tells the user.

Two ways to restore sample data:

- **Reset demo data** (sidebar) replaces bills, documents, subscriptions, tasks and appointments, and clears activity and snoozes. The name and theme stay.
- **The error screen's reset**, after confirmation, deletes every key starting with `lifesync_` and reloads. The theme stays.

When changing a saved data shape, keep existing users' data readable. There is no migration system.

---

## Dates, forms and reminders

- Calendar dates are `"YYYY-MM-DD"` strings. Use the helpers in `utils/helpers.js`; passing such a string to `new Date()` treats it as UTC and can show the wrong day.
- `useToday` refreshes the Dashboard and the top bar's overdue reminder count at midnight and when the tab becomes visible. Add it to any other view that must update while left open.
- Forms use `ItemForm` with field definitions from `utils/fields.js`. Supported types: text, number, date, time, select, textarea and checkbox.
- Validation (`utils/validation.js`) limits amounts to ₹1 crore with up to 2 decimal places, and dates to the years 1900 to 2100.
- Reminders come from `utils/reminders.js`. "Upcoming" starts 30 days ahead, or 60 days for documents. The Reminders page lists the 50 most recent completed ones.

---

## Themes and styling

- Colours, spacing, radius and shadows are CSS custom properties in `styles/index.css`. Light values are on `:root`; dark values are on `:root[data-theme='dark']`.
- The Topbar button toggles the theme through `useTheme`, which saves it under `lifesync-theme`.
- A script in `index.html` applies the saved theme before the page paints. The default is light; the operating system's theme setting is not used.
- Layout breakpoints are in the stylesheets as `max-width` media queries (1100, 1024, 860, 640 and 560 px).
- Animations respect the "reduce motion" setting.

---

## Accessibility

- "Skip to content" link, page titles and heading focus on navigation
- Dialogs trap focus, close with Escape, return focus and warn about unsaved changes
- Tabs and search suggestions work with the keyboard
- Form errors are linked to their fields
- ESLint checks JSX with `eslint-plugin-jsx-a11y`

---

## Testing

Vitest 4 with Testing Library. The suite has **23 test files and 473 tests**.

```bash
npm test
npm run test:watch
npm test -- src/utils/helpers.test.js
```

The last command runs a single file.

**Configuration** (`vite.config.js`):

- Tests run in Node by default.
- Component and page tests opt in to a browser-like DOM with `// @vitest-environment jsdom` on the first line.
- Test files are found at `src/**/*.test.{js,jsx}`.

**Shared helpers** (`src/test/`):

| File | Purpose |
|---|---|
| `setup.js` | For jsdom tests: DOM matchers, cleanup, empty storage after each test, and missing browser features |
| `fixtures.js` | Fixed sample data; its "today" is 24 November 2026 |
| `render.jsx` | `renderApp(route)` renders the whole app with fixed data in a `MemoryRouter`; `freezeToday()` fixes the date |
| `timezone.js` | Run code in different time zones and set a fake "now" |

Tests use their own storage and never touch the data in your browser.

**Dates in tests:** set the fake clock **before** building anything that depends on today, inside `beforeEach` or the test itself. Code at the top of a `describe` block runs before the clock is faked and sees the real date.

---

## Linting, build and CI

**ESLint** (`eslint.config.js`) uses the recommended rules for JavaScript, React, React Hooks and JSX accessibility. Unused variables are errors unless prefixed with `_`; `console.log` is a warning. PropTypes checks are off. No code formatter is configured; `.editorconfig` and `.gitattributes` in the repository root keep basic formatting and line endings consistent.

**Build:** `npm run build` writes static files to `dist/`, which Git ignores. Vite 8's default browser targets apply (Chrome 111, Edge 111, Firefox 114, Safari 16.4). The router uses normal paths, so a web host must serve `index.html` for every page address.

**CI** (`.github/workflows/ci.yml`) runs on pull requests and pushes to `main`, on Ubuntu 24.04 with the Node version from `.nvmrc`:

```
npm ci  →  npm run lint  →  npm test  →  npm run build
```

It has read-only repository access and does not deploy.

---

## Phase history and status

**Original rule:** one phase at a time, each ending with a working, testable app. The plan paired frontend phase N with backend phase N ([backend plan](../backend/BACKEND.md)). Frontend phases 1 to 9 were completed first, using LocalStorage; no backend phase has started.

The checklists below summarise each phase. Some wording has been corrected to match the code, and notes mark later changes.

### Phase 1: Foundation
**Goal:** a navigable app shell.
- [x] Scaffold Vite + React, install `react-router-dom` and `lucide-react`
- [x] CSS design tokens (colors, spacing, radius, shadows), base reset
- [x] `AppLayout`: sidebar, topbar, `<Outlet/>`
- [x] Routes for all pages with placeholder content
- [x] Responsive sidebar (hamburger drawer on mobile)
- [x] `useLocalStorage` hook
- [x] `AppContext` skeleton and `helpers.js` (date and currency helpers, id generator)

**Done when:** every sidebar link opens a page, and the layout works at desktop, tablet and mobile widths.

### Phase 2: Shared UI components
**Goal:** reusable building blocks, so later phases go fast.
- [x] `Modal`, `PageHeader`, `EmptyState`, `StatCard`
- [x] `StatusBadge` (overdue, due soon, paid, pending, expired, valid and more)
- [x] `ItemForm` driven by a field-config array (see the current field types above)
- [x] Form validation (required fields, valid dates)

**Done when:** a demo modal with a form opens, validates and returns values.

### Phase 3: Bills & Payments
**Goal:** the first full module.
- [x] Bills context state and CRUD actions
- [x] Bills page: list, add, edit and delete modals
- [x] Categories: electricity, mobile, internet, rent, other
- [x] Mark paid, which moves the bill into payment history
- [x] Monthly recurring bills: marking paid creates next month's bill
- [x] Filters by status (Upcoming and Payment history tabs) and category
- [x] Seed sample data on first load

**Done when:** bills persist after refresh and the recurring flow works.

### Phase 4: Documents Manager
- [x] Documents state and CRUD
- [x] Types: Aadhaar, PAN, Passport, Driving Licence, Insurance, Other
- [x] Fields: holder, number, issue date, expiry date, notes
- [x] Expiry status: valid, expiring within 60 days, expired
- [x] Card grid layout and expiry alert banner

### Phase 5: Subscriptions
- [x] Subscriptions state and CRUD
- [x] Fields: name, cost, monthly or yearly cycle, next renewal date, auto-renew toggle
- [x] Totals: monthly spend, yearly spend, normalized per-month cost
- [x] Renewal-soon indicator

### Phase 6: Tasks & Appointments
- [x] Tasks: title, priority, deadline, complete toggle
- [x] Appointments: title, date, time, location
- [x] Tabs for Tasks and Appointments, with pending counts
- [x] Sorting by date (then priority for tasks); filters by status and task priority

### Phase 7: Dashboard, Reminders, Activity
**Goal:** connect all modules.
- [x] Activity log of additions, edits, deletions, payments, completions and renewals
- [x] Activity page with type filter and clear history
- [x] Reminders derived from bills, documents, subscriptions, tasks and appointments
- [x] Reminders tabs (Overdue, Upcoming, Snoozed, Completed) with snooze options
- [x] Dashboard: stat cards, expiry alerts, recent activity
- [x] Upcoming payments, today's tasks and a unified 30-day timeline *(later replaced by the "Needs attention" panel)*

### Phase 8: Calendar, Search, Quick Add
- [x] Calendar month and week views, colored event dots by type
- [x] Day click shows that day's events
- [x] Global search in the topbar and a Search results page with type filter
- [x] Quick Add modal in the topbar (choose a type, then a short form)
- [x] Smart priority indicators used consistently across the app

### Phase 9: Polish & hardening
- [x] Full responsive pass (desktop, tablet, mobile)
- [x] Empty, loading and error states
- [x] Accessibility (labels, focus, keyboard-closable modals)
- [x] Beginner-friendly code comments on key logic
- [x] "Reset demo data" option, README

### After Phase 9
- [x] Redesigned interface with light and dark themes
- [x] Dashboard charts, smart insights, "Needs attention" panel and tabbed analytics
- [x] Further accessibility, validation, error handling and search improvements
- [x] Data safety: input limits, cross-tab sync and save-failure notice
- [x] Tests and ESLint
- [x] Upgrades to Vite 8, Vitest 4 and React Router 7
- [x] Line-ending and editor settings, and GitHub Actions CI

### Phase 10: Backend integration (not started; after backend Phase 2+)
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
| After 9 | Redesign, insights, safety, quality tooling | Done |
| 10 | Backend integration | Not started |
