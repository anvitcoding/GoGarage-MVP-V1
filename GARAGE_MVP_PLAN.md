# GoGarage MVP — Build Plan & Architecture

**Purpose of this document:** This is the single source of truth for building the MVP. It is written for an AI coding agent (Claude Code) to execute against, step by step. It defines exact scope, data model, API contract, folder structure, and build order. Do not add features beyond what is listed here — see "Out of Scope" section, which is deliberate and load-bearing.

**Source documents this MVP is distilled from:** `GoGarage` (client PRD, v2.0) and `AutoServePro Technical Specification` (internal spec, v1.0). Both describe a large, multi-location, multi-module garage operating system. This MVP intentionally implements only the smallest slice of both that proves the **core service job lifecycle end-to-end**, so it can be demoed to the client before investing in the full build.

---

## 1. MVP Goal

Show one complete, working flow, for three roles, in one garage (single location):

1. A **Customer** registers, adds a vehicle, and requests a service.
2. An **Admin** (garage owner/manager) sees the new job, assigns it to a Technician.
3. A **Technician** logs the parts/labour used and updates job status through to completion.
4. The system auto-generates an invoice. The Admin marks it paid.
5. The Customer sees live status of their job and can view/download their invoice and past service history.

That is the entire demo. Every feature below exists to serve this loop.

---

## 2. Explicit Scope

### 2.1 In Scope (build this)

- Email + password authentication (JWT), 3 roles: `admin`, `technician`, `customer`
- Single garage / single location (no organisation or multi-branch hierarchy)
- Customer self-registration; Admin creates technician/admin accounts
- Vehicle CRUD (manual entry only — no external registration lookup)
- Service Job ("job card") lifecycle: `created → in_progress → completed`
- Job Items: technician logs services/parts with quantity and price against a job
- Auto-generated invoice on job completion (flat 18% GST, no CGST/SGST split)
- Manual invoice payment marking (cash / UPI / card as a label only — no real payment processing)
- Role-scoped dashboards: Admin (all jobs + basic revenue total), Technician (assigned jobs), Customer (own vehicles, job status, invoices, history)
- Status refresh via simple polling / manual refresh (no WebSocket)

### 2.2 Out of Scope (do NOT build — explicitly deferred to post-MVP)

These are all present in the source documents but are deliberately excluded so the MVP stays small and shippable. If asked to "also add X," check this list first — if it's here, it's a scope decision, not an oversight.

- Multi-organisation / multi-location / regional hierarchy, Super Admin & Regional Manager & Service Manager roles
- Row-Level Security, cross-location data isolation
- Real-time WebSocket live tracker and in-app chat (use polling instead)
- Redis, Celery, background task queue
- Vahan/RC lookup API integration (vehicle details are entered manually)
- WhatsApp Business API, SMS/OTP gateway, push notifications
- Payment gateway integration (Razorpay/PhonePe/Pinelabs POS) — payment status is just a manual toggle
- Loyalty & wallet system, referrals
- Discount engine and discount governance/approval workflows
- Inventory management (central warehouse, stock levels, transfers, reorder alerts)
- CRM features: leads, complaints, ratings, service reminders
- Analytics/reporting dashboards, KPI trend charts, heatmaps
- Photo/video upload, vehicle body condition reports, tyre condition tracking
- Audit logs
- GST CGST/SGST/IGST breakdown (use one flat `gst_percent` field instead)
- Any mobile app (Android) — web only, responsive

If a request would require any of the above, flag it back to the user rather than silently implementing it.

---

## 3. Tech Stack (fixed — do not substitute)

| Layer | Choice |
|---|---|
| Frontend | React (Vite), React Router, Axios, Tailwind CSS |
| Backend | FastAPI (Python 3.12), Pydantic v2 |
| ORM / Migrations | SQLAlchemy 2.x + Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose or PyJWT), bcrypt password hashing (passlib) |
| Containerization | Docker + Docker Compose (db, backend, frontend) |
| Package managers | pip (backend), npm (frontend) |

No Redis, no Celery, no WebSocket libraries, no cloud storage SDKs. Keep `requirements.txt` and `package.json` minimal.

---

## 4. Data Model

Single Postgres database, no tenancy columns. Use integer serial primary keys (simplest for MVP; UUID is unnecessary complexity here).

### `users`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | varchar(120) | |
| email | varchar(255) unique | login identifier |
| phone | varchar(20) | optional, display only |
| password_hash | varchar(255) | bcrypt |
| role | enum(`admin`,`technician`,`customer`) | |
| is_active | boolean default true | |
| created_at | timestamp default now() | |

### `vehicles`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| customer_id | FK → users.id | owner |
| reg_number | varchar(20) | e.g. `MH12AB1234` |
| make | varchar(60) | |
| model | varchar(60) | |
| year | int | nullable |
| fuel_type | varchar(20) | nullable — petrol/diesel/ev/cng |
| created_at | timestamp default now() | |

### `service_jobs`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| vehicle_id | FK → vehicles.id | |
| customer_id | FK → users.id | denormalized for easy filtering |
| technician_id | FK → users.id, nullable | assigned by admin |
| status | enum(`created`,`in_progress`,`completed`) | |
| description | text | customer's stated issue / request |
| km_reading | int | nullable |
| created_at | timestamp default now() | |
| updated_at | timestamp | updated on every status change |
| completed_at | timestamp, nullable | |

### `job_items`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| job_id | FK → service_jobs.id | |
| description | varchar(200) | e.g. "Brake pad replacement" |
| item_type | enum(`service`,`part`) | |
| quantity | int default 1 | |
| unit_price | numeric(10,2) | |
| added_by | FK → users.id | technician who logged it |
| created_at | timestamp default now() | |

### `invoices`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| job_id | FK → service_jobs.id, unique | one invoice per job |
| subtotal | numeric(10,2) | sum of job_items |
| gst_percent | numeric(4,2) default 18.00 | |
| gst_amount | numeric(10,2) | computed |
| total | numeric(10,2) | subtotal + gst_amount |
| status | enum(`unpaid`,`paid`) default `unpaid` | |
| payment_mode | varchar(20), nullable | `cash` / `upi` / `card` — label only |
| created_at | timestamp default now() | |
| paid_at | timestamp, nullable | |

**Relationships:** `users (customer) 1—N vehicles`, `vehicles 1—N service_jobs`, `service_jobs 1—N job_items`, `service_jobs 1—1 invoices`, `users (technician) 1—N service_jobs`.

**Invoice generation rule:** when a `service_job` transitions to `completed`, the backend automatically sums its `job_items`, creates the `invoices` row, and locks further edits to `job_items` on that job.

---

## 5. API Contract (REST, `/api/v1` prefix)

All protected routes require `Authorization: Bearer <jwt>`. Errors return `{"detail": "message"}` with standard HTTP status codes (400/401/403/404/422).

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Customer self-registration |
| POST | `/auth/login` | Public | Returns JWT + role |
| GET | `/auth/me` | Any authenticated | Current user profile |
| GET | `/users` | Admin | List all staff/customers |
| POST | `/users` | Admin | Create technician or admin account |
| PATCH | `/users/{id}` | Admin | Activate/deactivate |
| GET | `/vehicles` | Customer (own) / Admin (all) | List vehicles |
| POST | `/vehicles` | Customer, Admin | Add vehicle |
| GET | `/vehicles/{id}` | Owner, Admin | Vehicle detail + service history |
| GET | `/jobs` | Role-scoped (see below) | List jobs |
| POST | `/jobs` | Customer, Admin | Create job card |
| GET | `/jobs/{id}` | Owner, assigned technician, Admin | Job detail incl. items + invoice |
| PATCH | `/jobs/{id}` | Admin (assign technician, status), Technician (status, own job) | Update job |
| POST | `/jobs/{id}/items` | Technician (assigned), Admin | Add job item |
| DELETE | `/jobs/{id}/items/{item_id}` | Technician (assigned), Admin | Remove item (only while job not completed) |
| GET | `/invoices` | Admin (all) / Customer (own) | List invoices |
| GET | `/invoices/{id}` | Owner, Admin | Invoice detail |
| PATCH | `/invoices/{id}` | Admin | Mark paid + payment_mode |

**Role scoping for `GET /jobs`:** Customer → only jobs where `customer_id = self`. Technician → only jobs where `technician_id = self`. Admin → all jobs, filterable by `?status=`.

---

## 6. Frontend Pages

| Route | Role | Purpose |
|---|---|---|
| `/login` | Public | Login |
| `/register` | Public | Customer signup |
| `/customer` | Customer | Dashboard: vehicle cards, active job status |
| `/customer/vehicles/new` | Customer | Add vehicle form |
| `/customer/jobs/new` | Customer | Request a service (pick vehicle, describe issue) |
| `/customer/jobs/:id` | Customer | Job status, items, invoice when available |
| `/customer/history` | Customer | Past completed jobs + invoices |
| `/admin` | Admin | All jobs (simple 3-column board: Created / In Progress / Completed), revenue total |
| `/admin/jobs/:id` | Admin | Assign technician, view items/invoice, mark invoice paid |
| `/admin/users` | Admin | Create/list technician & admin accounts |
| `/technician` | Technician | List of assigned jobs |
| `/technician/jobs/:id` | Technician | Update status, add/remove job items |

Use a shared `AuthContext` + `ProtectedRoute` wrapper that redirects based on `role`. Keep styling functional and clean (Tailwind utility classes) — this is a demo, not a design showcase.

---

## 7. Repository Structure

```
gogarage-mvp/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/versions/
│   └── app/
│       ├── main.py
│       ├── core/
│       │   ├── config.py          # settings via pydantic-settings
│       │   ├── security.py        # JWT + password hashing
│       │   └── deps.py            # get_current_user, require_role()
│       ├── db/
│       │   ├── base.py
│       │   └── session.py
│       ├── models/                # SQLAlchemy models (one file per entity)
│       ├── schemas/                # Pydantic request/response models
│       ├── api/v1/
│       │   ├── router.py
│       │   └── endpoints/          # auth.py, users.py, vehicles.py, jobs.py, job_items.py, invoices.py
│       ├── services/                # invoice calculation, job status transition logic
│       └── seed.py                  # demo data script
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/                     # axios instance + endpoint wrapper functions
        ├── auth/                    # AuthContext, ProtectedRoute
        ├── components/              # shared UI: StatusBadge, JobCard, Button, etc.
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── customer/
        │   ├── admin/
        │   └── technician/
        ├── routes.jsx
        ├── App.jsx
        └── main.jsx
```

---

## 8. Build Order (execute in this sequence)

1. **Scaffolding** — repo structure above, `docker-compose.yml` (postgres + backend + frontend services), `.env.example` for both apps.
2. **Backend foundation** — SQLAlchemy models, Alembic initial migration, DB session, config, JWT + password hashing utilities.
3. **Backend auth** — `/auth/register`, `/auth/login`, `/auth/me`, `get_current_user` + `require_role()` dependencies.
4. **Backend core APIs** — users, vehicles, jobs, job_items, invoices endpoints per section 5. Include the invoice-auto-generation logic on job completion.
5. **Seed script** — one admin, one technician, one demo customer with a vehicle, runnable via `python -m app.seed`.
6. **Frontend foundation** — Vite app, Tailwind setup, axios client with JWT interceptor, AuthContext, ProtectedRoute, routing skeleton.
7. **Frontend — customer flow** — register/login, add vehicle, request service, view job status, view invoice/history.
8. **Frontend — admin flow** — job board, assign technician, manage users, mark invoice paid.
9. **Frontend — technician flow** — assigned jobs list, update status, log job items.
10. **End-to-end pass** — manually walk the full demo loop (section 1) using seeded + newly created data; fix gaps.

Do not start a later step before the prior step's API/UI is functional — each step depends on the one before it.

---

## 9. Acceptance Criteria (Definition of Done for the MVP demo)

- [ ] A new customer can register, log in, add a vehicle, and submit a service request
- [ ] The request appears for Admin, who assigns a technician
- [ ] The technician sees the job, logs at least one job item, and marks the job completed
- [ ] An invoice is automatically generated with correct subtotal/GST/total
- [ ] Admin marks the invoice paid
- [ ] The customer sees the completed job, the invoice, and it appears in their service history
- [ ] All three roles are blocked from actions/data outside their scope (e.g., a customer cannot see another customer's jobs; a technician cannot see invoices for jobs not assigned to them)
- [ ] The whole flow runs via `docker compose up` with no manual steps beyond running the seed script and migrations

---

## 10. Notes for the Agent

- Prefer explicit, boring code over clever abstractions — this is a demo build, optimize for readability and for being easy to extend later into the full GoGarage/AutoServePro architecture.
- Every entity/field added here maps directly onto the full multi-location schema described in the source documents (e.g. `service_jobs` here becomes location-scoped later, `users.role` here becomes the 6-role matrix later). Name things so that later migration is additive, not a rewrite — but do not build the future scaffolding now.
- See the accompanying `CLAUDE.md` for coding conventions and hard rules that apply across the whole codebase.
