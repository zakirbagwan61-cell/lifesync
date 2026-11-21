# LifeSync: Personal Life Organizer

**One place for everything that matters.**

LifeSync helps you keep track of bills, documents, subscriptions, tasks, appointments and reminders in a single dashboard, so you never miss an important responsibility.

## Features

- **Dashboard:** upcoming payments, document expiry alerts, today's plan, recent activity and a unified timeline
- **Bills & Payments:** add, edit and delete bills, mark them paid, monthly recurring bills, payment history
- **Documents:** Aadhaar, PAN, Passport, Licence, Insurance and more, with expiry alerts
- **Subscriptions:** monthly and yearly costs, renewal dates, auto-renew, total spending
- **Tasks & Appointments:** priorities, deadlines, times and locations
- **Reminders:** upcoming, overdue, snoozed and completed, generated automatically
- **Calendar:** month and week views with everything on its date
- **Activity History:** a log of everything you add, change, pay or complete
- **Quick Add**, **global search**, and a responsive layout for desktop, tablet and phone

## Tech stack

React + Vite, JavaScript, CSS, React Router, Lucide React, React Hooks and Context API.
Data is stored in the browser's localStorage for now.

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Then open the address shown in the terminal (usually http://localhost:5173).

Use **Reset demo data** at the bottom of the sidebar to restore the sample data.

## Project structure

```
lifesync/
├── frontend/   React app (see frontend/FRONTEND.md for the phase plan)
└── backend/    API plan (see backend/BACKEND.md)
```

## Roadmap

- [x] Frontend phases 1 to 9: all modules working with localStorage
- [ ] Backend API with authentication and a cloud database
- [ ] Connect the frontend to the backend
- [ ] Secure document uploads, scheduled notifications, cloud sync