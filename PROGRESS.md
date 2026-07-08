# GoGarage MVP — Build Progress

Tracking the 10 build steps from `GARAGE_MVP_PLAN.md` section 8.

- [x] **Step 1: Scaffolding** — repo structure, docker-compose.yml, .env.example, health-check endpoint, placeholder React page
- [x] **Step 2: Backend foundation** — SQLAlchemy models, Alembic initial migration, DB session, config, JWT + password hashing utilities
- [x] **Step 3: Backend auth** — `/auth/register`, `/auth/login`, `/auth/me`, `get_current_user` + `require_role()` dependencies
- [x] **Step 4: Backend core APIs** — users, vehicles, jobs, job_items, invoices endpoints per section 5, including invoice auto-generation logic
- [x] **Step 5: Seed script** — one admin, one technician, one demo customer with a vehicle, runnable via `python -m app.seed`
- [x] **Step 6: Frontend foundation** — Vite app, Tailwind setup, axios client with JWT interceptor, AuthContext, ProtectedRoute, routing skeleton
- [x] **Step 7: Frontend — customer flow** — register/login, add vehicle, request service, view job status, view invoice/history
- [x] **Step 8: Frontend — admin flow** — job board, assign technician, manage users, mark invoice paid
- [x] **Step 9: Frontend — technician flow** — assigned jobs list, update status, log job items
- [x] **Step 10: End-to-end pass** — manually walk the full demo loop (section 1) using seeded + newly created data; fix gaps
