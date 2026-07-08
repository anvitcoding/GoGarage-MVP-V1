# CLAUDE.md — Project Rules for GoGarage MVP

This file is the standing set of rules for any AI agent (Claude Code) working in this repository. It applies to every session and every task, in addition to whatever specific instructions are given in a prompt. Read `GARAGE_MVP_PLAN.md` first for scope/data model/API contract — this file governs *how* to build it, not *what* to build.

---

## 1. Prime Directive: This Is an MVP

The goal is a small, working, demoable slice — not the full GoGarage/AutoServePro platform. Before adding anything not explicitly listed in `GARAGE_MVP_PLAN.md`:

1. Check the "Out of Scope" list in that plan.
2. If the new thing is on that list, do NOT build it. Say so instead of implementing it.
3. If it's genuinely missing from the plan and clearly required for the core flow to work, implement the smallest version possible and note the addition in your response — do not silently expand scope.

When in doubt, choose the simpler implementation. A hardcoded value, a manual step, or a plain HTML table is preferable to a new library, a new service, or a generalized abstraction, for this MVP.

---

## 2. Tech Stack — Fixed, Do Not Substitute

- **Frontend:** React + Vite, React Router, Axios, Tailwind CSS.
- **Backend:** FastAPI, Python 3.12, Pydantic v2.
- **DB:** PostgreSQL, accessed only via SQLAlchemy 2.x models + Alembic migrations.
- **Auth:** JWT bearer tokens, bcrypt password hashing.

Do not introduce Redis, Celery, WebSockets, GraphQL, ORMs other than SQLAlchemy, CSS frameworks other than Tailwind, or state managers beyond React Context, unless explicitly asked. If a task seems to need one of these, flag it back rather than adding it quietly.

---

## 3. Backend Rules

- **Never hand-write SQL migrations or edit the DB schema directly.** Every schema change goes through `alembic revision --autogenerate` + a reviewed migration file.
- **SQLAlchemy models and Pydantic schemas are separate files/classes.** Never return a raw ORM model from an endpoint — always map to a Pydantic response schema.
- **All queries are parameterized via the ORM.** No raw SQL string concatenation, ever.
- **Every protected route depends on `get_current_user`** and, where relevant, a `require_role(...)` dependency. Do not implement ad-hoc auth checks inside endpoint bodies.
- **Role scoping happens in the query, not after fetching.** E.g., a customer's `GET /jobs` should filter `WHERE customer_id = current_user.id` at the query level, not fetch everything and filter in Python.
- **Passwords are always hashed with bcrypt (passlib).** Never store, log, or return plaintext passwords.
- **JWTs carry `user_id` and `role` only.** No location/org claims for this MVP (see plan — single location).
- **Endpoints live under `/api/v1/`.** Follow the exact paths/methods in `GARAGE_MVP_PLAN.md` section 5 unless a gap is found, in which case follow the same REST conventions (plural nouns, nested sub-resources for items under jobs).
- **Errors return `{"detail": "..."}` with correct HTTP status codes** (400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 422 schema error). Don't invent a different error envelope.
- **Business logic (e.g., invoice calculation, status-transition rules) lives in `app/services/`,** not inline in route handlers. Route handlers stay thin: parse request → call service → return response.
- **Environment variables only for secrets/config** (DB URL, JWT secret, etc.), loaded via `pydantic-settings`. Never commit a `.env` file — only `.env.example` with placeholder values.

---

## 4. Frontend Rules

- **Functional components + hooks only.** No class components.
- **One Axios instance** (`src/api/client.js` or similar) with a request interceptor that attaches the JWT from context/storage, and a response interceptor that handles 401 by redirecting to `/login`.
- **Auth state lives in a single `AuthContext`.** Role-based routing goes through one `ProtectedRoute` component that takes an `allowedRoles` prop — don't duplicate auth-check logic across pages.
- **Keep components small and page-scoped.** Shared/reusable bits (status badges, job cards, buttons) go in `src/components/`; anything used by exactly one page stays in that page's file.
- **No premature design polish.** Tailwind utility classes, consistent spacing, and clear typography are enough. Don't build a custom design system for a demo.
- **Data fetching is plain `useEffect` + `useState`, or a small custom hook per resource** (e.g. `useJobs()`). Don't add React Query/SWR/Redux for this MVP unless asked.
- **Status refresh is manual (a refresh button) or a simple `setInterval` poll (e.g. every 10s) on the job detail page** — there is no WebSocket in this MVP.

---

## 5. Data & Naming Consistency

- Follow the exact table/column names in `GARAGE_MVP_PLAN.md` section 4. Don't rename entities (e.g. keep `service_jobs`, not `jobs`, as the table name — this matters for a clean upgrade path to the full platform later).
- Enums (`role`, `status`, `item_type`, `payment_mode`) are implemented as Postgres enum types via SQLAlchemy, not free-text strings with app-level validation only.
- Timestamps are UTC. Let the DB set `created_at` via `server_default=func.now()`.

---

## 6. What "Done" Looks Like for Any Task

Before considering a task complete:

1. The relevant endpoint(s) or page(s) work against the full stack running via `docker compose up` (or the equivalent local dev setup), not just in isolation.
2. Role scoping has been checked, not just the happy path — verify a customer literally cannot fetch another customer's data, a technician cannot see invoices, etc.
3. If a new table/column was added, an Alembic migration exists for it.
4. The seed script (`app/seed.py`) still runs cleanly and produces a working demo login for admin, technician, and customer.
5. No new dependency was added without a clear reason tied to something in `GARAGE_MVP_PLAN.md`.

---

## 7. Running the Project

- `docker compose up --build` starts Postgres, backend, and frontend.
- `docker compose exec backend alembic upgrade head` applies migrations.
- `docker compose exec backend python -m app.seed` seeds demo accounts (one admin, one technician, one customer with one vehicle).
- Backend serves on the port defined in `docker-compose.yml`; frontend dev server proxies API calls to it.

---

## 8. Communication Back to the User

- If a request conflicts with the MVP scope or this file's rules, say so plainly and propose the smallest compliant alternative, rather than quietly doing something bigger or something different.
- If something in `GARAGE_MVP_PLAN.md` is ambiguous or missing for a task at hand, make the smallest reasonable assumption, state it, and proceed — don't block on it.
