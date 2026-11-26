# LifeSync: Personal Life Organizer

**One place for everything that matters.**

LifeSync helps you keep track of bills, documents, subscriptions, tasks, appointments and reminders in a single dashboard, so you never miss an important responsibility.

## Status

- **Frontend:** a working React app. All data is saved in your browser's LocalStorage.
- **Backend:** **implementation has not started.** The `backend/` folder contains only a plan. There are no accounts, server, database or cloud sync.

> **Your data and privacy:** everything you enter, **including document numbers such as Aadhaar or PAN**, is stored **unencrypted** in the browser you use. Anyone with access to that browser profile can read it. Clearing the site's data deletes it.

## Features

- **Dashboard:** summary figures, a "Needs attention" list (Today, Next 7 days, Overdue, All) with quick actions, smart recommendations, spending and productivity summaries, analytics charts, document expiry alerts and recent activity
- **Bills & Payments:** add, edit and delete bills, mark them paid, monthly recurring bills, payment history and category filter
- **Documents:** Aadhaar, PAN, Passport, Driving Licence, Insurance and Other, with expiry alerts 60 days ahead
- **Subscriptions:** monthly and yearly costs, totals, renewal dates, auto-renew switch and "mark as renewed"
- **Tasks & Appointments:** priorities, deadlines, dates, times and locations, with status and priority filters
- **Reminders:** generated from your items and grouped as overdue, upcoming, snoozed and completed; snooze for 1 day, 3 days, 1 week or 1 month
- **Calendar:** month and week views of everything on its date
- **Search:** suggestions while you type and a results page with a type filter (document numbers are masked in search)
- **Quick Add:** create any item from the top bar
- **Activity History:** your latest 200 changes, grouped by day, with a type filter and links to items
- **Safety:** delete confirmations; Undo after paying a bill, renewing a subscription, or finishing or snoozing a reminder; a warning before discarding typed changes; a notice if saving fails; and updates shared between open tabs
- **Interface:** light and dark themes, layouts for desktop, tablet and phone, and keyboard and screen reader support

## Tech stack

| Area | Tools |
|---|---|
| UI | React 18, JavaScript (JSX), plain CSS, Lucide React icons |
| Routing | React Router 7 (`react-router-dom`) |
| State and storage | React Context and Hooks, browser LocalStorage |
| Build | Vite 8 |
| Tests | Vitest 4, Testing Library, jsdom |
| Quality | ESLint 9, GitHub Actions |

Charts are drawn with the app's own SVG components.

## Getting started

### Requirements

- **Node.js** 20.19 or later within 20.x, 22.12 or later within 22.x, or 24 and newer. The project uses **Node 24** (see `.nvmrc`), which is also what CI runs.
- **npm** (included with Node.js)

### Install and run

All commands run from the `frontend` folder.

```bash
cd frontend
npm ci
npm run dev
```

Then open the address shown in the terminal (usually http://localhost:5173).

`npm ci` installs exactly the versions in `package-lock.json`. Use `npm install` only when you intend to change dependencies.

The app starts with sample data. **Reset demo data** at the bottom of the sidebar restores it, which **replaces your bills, documents, subscriptions, tasks and appointments and clears the activity history**.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create the production build in `frontend/dist/` |
| `npm run preview` | Serve the production build locally; run `npm run build` first (usually http://localhost:4173) |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests again as files change |
| `npm run lint` | Check the code with ESLint |
| `npm run lint:fix` | Apply ESLint's automatic fixes |

LocalStorage belongs to one address, so the development server and the preview server each keep their own data.

### Before you push

```bash
npm run lint
npm test
npm run build
```

GitHub Actions runs `npm ci` and these three checks on every pull request and on every push to `main` (see `.github/workflows/ci.yml`). It does not deploy anything.

## Browser support and hosting

- The production build uses Vite 8's default targets: Chrome 111, Edge 111, Firefox 114 and Safari 16.4 or newer.
- The page loads the Inter font from Google Fonts.
- LifeSync is a single-page app served from the root of a site. A web host must return `index.html` for page addresses such as `/bills`.

## Project structure

```
lifesync/
├── .github/workflows/ci.yml   automated lint, test and build
├── .editorconfig              editor settings
├── .gitattributes             line-ending rules
├── .nvmrc                     Node.js version
├── frontend/                  React app (developer guide: frontend/FRONTEND.md)
└── backend/                   API plan only (backend/BACKEND.md)
```

## Documentation

- [Frontend developer guide](frontend/FRONTEND.md): architecture, routing, data, themes, testing and phase history
- [Backend plan](backend/BACKEND.md): proposed API and phases, not yet implemented

## Roadmap

- [x] Frontend phases 1 to 9: all modules working with LocalStorage
- [x] Further frontend work: redesigned dashboard, themes, charts, insights, accessibility and data safety
- [x] Quality tooling: tests, ESLint, dependency upgrades and CI
- [ ] Backend API with authentication and a cloud database
- [ ] Connect the frontend to the backend
- [ ] Secure document uploads, scheduled notifications, cloud sync
