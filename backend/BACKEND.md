# LifeSync Backend: Phase-wise Plan

**Assumed stack (change before Phase 1 if you prefer another):** Node.js + Express, MongoDB with Mongoose, JWT authentication, bcrypt, dotenv, cors.
Your spec lists Supabase or Firebase as the future backend. If you pick one of those instead, Phases 1 and 2 shrink a lot (auth and DB come built in), and the later phases become schema and security-rule work.

**Rule:** one phase at a time. Backend phase N pairs with frontend phase N (see `../frontend/FRONTEND.md`). The frontend keeps using localStorage until Phase 10 of the frontend plan.

---

## Folder structure (final)

```
backend/
├── package.json
├── .env.example
└── src/
    ├── server.js            starts the server and connects to the DB
    ├── app.js               express app, middleware, route mounting
    ├── config/db.js         database connection
    ├── models/              User, Bill, Document, Subscription, Task, Appointment, Activity
    ├── controllers/         one per module (the logic)
    ├── routes/              one per module (the URLs)
    ├── middleware/          auth.js, errorHandler.js, validate.js
    └── utils/               dates, recurring-bill logic
```

Files are created only in the phase that needs them.

---

## Phase 1: Server foundation
- [ ] `npm init`, install express, mongoose, cors, dotenv, nodemon
- [ ] `server.js`, `app.js`, DB connection, `.env.example`
- [ ] Health route `GET /api/health`
- [ ] Central error handler and a consistent JSON response shape
- [ ] CORS configured for the Vite dev origin

**Done when:** the server starts, connects to the DB, and the health route responds.

## Phase 2: Authentication & users
- [ ] `User` model (name, email, hashed password)
- [ ] `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- [ ] bcrypt hashing, JWT issue and verify
- [ ] `auth` middleware, so every later route is scoped to `req.user`
- [ ] Input validation

**Done when:** a user can register, log in and call a protected route.

## Phase 3: Bills & Payments API
- [ ] `Bill` model (title, category, amount, dueDate, status, recurring, paidAt, user)
- [ ] CRUD: `GET/POST /api/bills`, `GET/PUT/DELETE /api/bills/:id`
- [ ] `PATCH /api/bills/:id/pay`: marks paid and creates the next month's bill if recurring
- [ ] Query filters (status, category), plus payment history endpoint
- [ ] Users can only access their own records

## Phase 4: Documents API
- [ ] `Document` model (type, number, issueDate, expiryDate, notes, user)
- [ ] CRUD endpoints
- [ ] Computed `expiryStatus` (valid, expiring, expired) in responses

## Phase 5: Subscriptions API
- [ ] `Subscription` model (name, cost, cycle, nextRenewal, autoRenew, user)
- [ ] CRUD endpoints
- [ ] `GET /api/subscriptions/summary`: monthly, yearly and normalized totals

## Phase 6: Tasks & Appointments API
- [ ] `Task` model (title, priority, deadline, completed)
- [ ] `Appointment` model (title, date, time, location)
- [ ] CRUD endpoints for both, with filters (pending, completed, date range)

## Phase 7: Dashboard, Reminders, Activity API
- [ ] `Activity` model, written automatically on create, update, delete, pay and complete
- [ ] `GET /api/activity` with type filter and pagination, plus clear history
- [ ] `GET /api/reminders`: upcoming, overdue and completed, derived from all modules
- [ ] `PATCH /api/reminders/snooze`: stores snooze-until per source item
- [ ] `GET /api/dashboard`: one call returning stats, upcoming payments, expiry alerts and today's items

## Phase 8: Calendar & Search API
- [ ] `GET /api/calendar?from=&to=`: all dated items in a range, tagged by type
- [ ] `GET /api/search?q=&type=`: search across all modules

## Phase 9: Hardening
- [ ] Rate limiting, helmet, request-size limits
- [ ] Complete validation and error messages
- [ ] Pagination on list endpoints
- [ ] Indexes on `user` and date fields
- [ ] Basic tests for auth, bills and recurring logic
- [ ] API documentation (README with endpoint list)

## Phase 10: Future enhancements
- [ ] Secure document file uploads and storage
- [ ] Scheduled jobs for due-date, expiry and renewal notifications (email or push)
- [ ] Real-time notifications
- [ ] User settings and personalization
- [ ] Cloud sync across devices, and import of the old localStorage data
- [ ] Deployment (server and managed database)

---

## API summary (final)

| Area | Base path |
|---|---|
| Auth | `/api/auth` |
| Bills | `/api/bills` |
| Documents | `/api/documents` |
| Subscriptions | `/api/subscriptions` |
| Tasks | `/api/tasks` |
| Appointments | `/api/appointments` |
| Reminders | `/api/reminders` |
| Activity | `/api/activity` |
| Dashboard | `/api/dashboard` |
| Calendar | `/api/calendar` |
| Search | `/api/search` |

## Phase / module status

| Phase | Scope | Status |
|---|---|---|
| 1 | Server foundation | Not started |
| 2 | Auth & users | Not started |
| 3 | Bills | Not started |
| 4 | Documents | Not started |
| 5 | Subscriptions | Not started |
| 6 | Tasks & Appointments | Not started |
| 7 | Dashboard, Reminders, Activity | Not started |
| 8 | Calendar & Search | Not started |
| 9 | Hardening | Not started |
| 10 | Future enhancements | Not started |
