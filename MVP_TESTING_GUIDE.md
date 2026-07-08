# GoGarage MVP — Testing & Reference Guide

This document covers everything needed to start, test, and verify the GoGarage MVP. It assumes you have Docker Desktop installed and running.

---

## 1. Starting the Services

```bash
# From the repo root:
docker compose up --build

# Wait for all 3 containers (db, backend, frontend) to be healthy.
# In another terminal, apply migrations and seed demo data:
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

### Services

| Service | Port | Purpose |
|---|---|---|
| PostgreSQL 16 | `5432` | Database |
| FastAPI backend | `8000` | REST API at `/api/v1/` |
| Vite + React frontend | `5173` | Browser UI; proxies `/api` → backend |

### Verify they're up

```bash
curl http://localhost:8000/api/v1/health
# → {"status":"ok","service":"gogarage-mvp"}

curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
# → 200
```

### Demo Accounts (from seed script)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@garage.com` | `admin123` |
| Technician | `tech@garage.com` | `tech123` |
| Customer | `customer@garage.com` | `customer123` |

The customer also has one vehicle pre-created: `MH12AB1234` (Maruti Swift, 2020, petrol).

---

## 2. Backend — 15 API Endpoints

All endpoints are under `http://localhost:8000/api/v1`. Protected routes require `Authorization: Bearer <token>`.

### 2.1 Auth (public)

#### `POST /auth/register` — Customer self-registration

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"9876543210","password":"secret123"}'
# → 201 {"access_token":"eyJ...","token_type":"bearer","role":"customer"}
```

#### `POST /auth/login` — Login

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garage.com","password":"admin123"}'
# → 200 {"access_token":"eyJ...","token_type":"bearer","role":"admin"}
```

#### `GET /auth/me` — Current user profile

```bash
curl -s http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
# → 200 {"id":7,"name":"Garage Admin","email":"admin@garage.com","role":"admin",...}
```

---

### 2.2 Users (admin only)

#### `GET /users` — List all users

```bash
curl -s http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# → 200 [{id, name, email, phone, role, is_active, created_at}, ...]
```

#### `POST /users` — Create technician or admin account

```bash
curl -s -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Tech","email":"newtech@garage.com","password":"tech123","role":"technician"}'
# → 201 {id, name, email, role:"technician", is_active:true, ...}
```

> **Note:** `role` must be `admin` or `technician`. Customer accounts are created via `/auth/register`.

#### `PATCH /users/{id}` — Activate/deactivate user

```bash
curl -s -X PATCH http://localhost:8000/api/v1/users/9 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active":false}'
# → 200 {..., is_active:false}
```

---

### 2.3 Vehicles

#### `GET /vehicles` — List vehicles

- **Customer:** sees only own vehicles
- **Admin:** sees all vehicles

```bash
curl -s http://localhost:8000/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN"
# → 200 [{id, customer_id, reg_number, make, model, year, fuel_type, created_at}, ...]
```

#### `POST /vehicles` — Add vehicle

- **Customer:** `customer_id` is ignored, always set to self
- **Admin:** must provide `customer_id`

```bash
# As customer:
curl -s -X POST http://localhost:8000/api/v1/vehicles \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reg_number":"MH12AB1234","make":"Maruti","model":"Swift","year":2020,"fuel_type":"petrol"}'
# → 201 {id, ...}

# As admin (for a specific customer):
curl -s -X POST http://localhost:8000/api/v1/vehicles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reg_number":"DL01XY9999","make":"Honda","model":"City","customer_id":9}'
# → 201 {id, ...}
```

#### `GET /vehicles/{id}` — Vehicle detail + service history

- **Access:** Owner customer or admin only

```bash
curl -s http://localhost:8000/api/v1/vehicles/3 \
  -H "Authorization: Bearer $CUST_TOKEN"
# → 200 {id, reg_number, ..., service_jobs: [{id, status, description, ...}]}
```

---

### 2.4 Service Jobs

#### `GET /jobs` — List jobs (role-scoped)

- **Customer:** own jobs only
- **Technician:** assigned jobs only
- **Admin:** all jobs; supports `?status=created|in_progress|completed`

```bash
curl -s "http://localhost:8000/api/v1/jobs?status=created" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# → 200 [{id, vehicle_reg_number, customer_name, technician_name, status, description, ...}]
```

#### `POST /jobs` — Create job card

- **Customer:** only for own vehicles
- **Admin:** can create for any vehicle

```bash
curl -s -X POST http://localhost:8000/api/v1/jobs \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":3,"description":"Oil change and brake check","km_reading":25000}'
# → 201 {id, status:"created", vehicle:{...}, customer_name:"...", items:[], invoice:null}
```

#### `GET /jobs/{id}` — Job detail with items + invoice

- **Access:** Job owner, assigned technician, or admin

```bash
curl -s http://localhost:8000/api/v1/jobs/1 \
  -H "Authorization: Bearer $TOKEN"
# → 200 {id, status, vehicle:{...}, customer_name, technician_name, items:[...], invoice:{...}}
```

#### `PATCH /jobs/{id}` — Update job

- **Admin:** can assign `technician_id` and/or change `status`
- **Technician:** can change `status` on own jobs only
- **Valid transitions:** `created → in_progress → completed`

```bash
# Admin assigns tech + starts job:
curl -s -X PATCH http://localhost:8000/api/v1/jobs/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technician_id":8,"status":"in_progress"}'
# → 200 {..., technician_name:"Garage Technician", status:"in_progress"}

# Technician marks completed (triggers auto-invoice):
curl -s -X PATCH http://localhost:8000/api/v1/jobs/1 \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
# → 200 {..., status:"completed", invoice:{id, subtotal, gst_amount, total, status:"unpaid"}}
```

---

### 2.5 Job Items

#### `POST /jobs/{id}/items` — Add service or part

- **Access:** Assigned technician or admin
- **Locked:** Cannot add to completed jobs

```bash
curl -s -X POST http://localhost:8000/api/v1/jobs/1/items \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Engine oil change","item_type":"service","quantity":1,"unit_price":800}'
# → 201 {id, job_id, description, item_type:"service", quantity:1, unit_price:800.0, ...}

# item_type must be "service" or "part"
```

#### `DELETE /jobs/{id}/items/{item_id}` — Remove item

- **Access:** Assigned technician or admin
- **Locked:** Cannot remove from completed jobs

```bash
curl -s -X DELETE http://localhost:8000/api/v1/jobs/1/items/5 \
  -H "Authorization: Bearer $TECH_TOKEN"
# → 204 (no content)
```

---

### 2.6 Invoices

#### `GET /invoices` — List invoices

- **Admin:** all invoices
- **Customer:** own invoices only
- **Technician:** returns `[]` (no access)

```bash
curl -s http://localhost:8000/api/v1/invoices \
  -H "Authorization: Bearer $TOKEN"
# → 200 [{id, job_id, subtotal, gst_percent, gst_amount, total, status, payment_mode, paid_at, ...}]
```

#### `GET /invoices/{id}` — Invoice detail

- **Access:** Invoice owner (via job) or admin

```bash
curl -s http://localhost:8000/api/v1/invoices/1 \
  -H "Authorization: Bearer $CUST_TOKEN"
# → 200 {id, job_id, subtotal, gst_percent:18.0, gst_amount, total, status, payment_mode, ...}
```

#### `PATCH /invoices/{id}` — Mark paid (admin only)

- Can only mark `unpaid → paid` (cannot un-pay)
- `payment_mode`: `cash`, `upi`, or `card` (label only)

```bash
curl -s -X PATCH http://localhost:8000/api/v1/invoices/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"paid","payment_mode":"upi"}'
# → 200 {..., status:"paid", payment_mode:"upi", paid_at:"2026-07-07T..."}
```

---

## 3. Frontend — 14 Pages Across 3 Roles

Open `http://localhost:5173` in a browser.

### 3.1 Public (no login required)

| Route | Page | Description |
|---|---|---|
| `/login` | LoginPage | Email + password form. After login, redirects to role dashboard. |
| `/register` | RegisterPage | Customer signup form (name, email, phone, password). Auto-logs in on success. |

### 3.2 Customer (`/customer/*`)

| Route | Page | APIs Used | Description |
|---|---|---|---|
| `/customer` | CustomerDashboard | `GET /vehicles`, `GET /jobs` | Vehicle cards, active jobs grid, refresh button, links to add vehicle/request service/history |
| `/customer/vehicles/new` | NewVehiclePage | `POST /vehicles` | Form: reg number, make, model, year, fuel type. Redirects to dashboard. |
| `/customer/jobs/new` | NewJobPage | `GET /vehicles`, `POST /jobs` | Vehicle dropdown, description textarea, km reading. Redirects to job detail. |
| `/customer/jobs/:id` | CustomerJobDetail | `GET /jobs/:id` | Job status badge, description, items table with prices, invoice card with GST breakdown. Polls every 10s. |
| `/customer/history` | HistoryPage | `GET /jobs`, `GET /invoices` | List of completed jobs with invoice totals and payment status. |

### 3.3 Admin (`/admin/*`)

| Route | Page | APIs Used | Description |
|---|---|---|---|
| `/admin` | AdminDashboard | `GET /jobs`, `GET /invoices` | 3-column Kanban board (Created / In Progress / Completed), revenue total from paid invoices, toggle to show/hide completed, refresh button |
| `/admin/jobs/:id` | AdminJobDetail | `GET /jobs/:id`, `GET /users`, `PATCH /jobs/:id`, `PATCH /invoices/:id` | Assign technician dropdown, status change buttons, items table, invoice card with mark-paid form (payment mode selector). Polls every 10s. |
| `/admin/users` | UsersPage | `GET /users`, `POST /users`, `PATCH /users/:id` | Create staff form (name, email, phone, password, role), full user table with activate/deactivate toggle |

### 3.4 Technician (`/technician/*`)

| Route | Page | APIs Used | Description |
|---|---|---|---|
| `/technician` | TechnicianDashboard | `GET /jobs` | Active assigned jobs list, recently completed section, refresh button |
| `/technician/jobs/:id` | TechnicianJobDetail | `GET /jobs/:id`, `PATCH /jobs/:id`, `POST /jobs/:id/items`, `DELETE /jobs/:id/items/:item_id` | Status change buttons, add-item form (description, type, qty, price), items table with per-item remove button, running total. Remove/add disabled when completed. Polls every 10s. |

---

## 4. Testing the Full Demo Scenario (via API)

This is the exact flow from Section 1 of the plan. Run these commands in order. Save tokens in variables as you go.

### Step 0: Get tokens

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garage.com","password":"admin123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

TECH_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tech@garage.com","password":"tech123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

### Step 1: Customer registers

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","email":"test@demo.com","phone":"9999999999","password":"demo123"}'
# → 201 with access_token and role=customer

CUST_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.com","password":"demo123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

### Step 2: Customer adds a vehicle

```bash
curl -s -X POST http://localhost:8000/api/v1/vehicles \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reg_number":"KA01AB1234","make":"Hyundai","model":"Creta","year":2023,"fuel_type":"diesel"}'
# → 201 with vehicle id — save this as VEHICLE_ID
```

### Step 3: Customer creates a service request

```bash
curl -s -X POST http://localhost:8000/api/v1/jobs \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":<VEHICLE_ID>,"description":"Regular service + AC not cooling","km_reading":15000}'
# → 201 with job id and status=created — save this as JOB_ID
```

### Step 4: Admin assigns technician and starts the job

```bash
curl -s -X PATCH http://localhost:8000/api/v1/jobs/<JOB_ID> \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technician_id":8,"status":"in_progress"}'
# → 200 status=in_progress, technician_name=Garage Technician
```

### Step 5: Technician logs parts and labour

```bash
# Labour:
curl -s -X POST http://localhost:8000/api/v1/jobs/<JOB_ID>/items \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Full service labour","item_type":"service","quantity":1,"unit_price":2000}'

# Parts:
curl -s -X POST http://localhost:8000/api/v1/jobs/<JOB_ID>/items \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"AC gas refill","item_type":"service","quantity":1,"unit_price":1500}'

curl -s -X POST http://localhost:8000/api/v1/jobs/<JOB_ID>/items \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Oil filter","item_type":"part","quantity":1,"unit_price":450}'
```

### Step 6: Technician marks job completed → invoice auto-generated

```bash
curl -s -X PATCH http://localhost:8000/api/v1/jobs/<JOB_ID> \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
# → 200 with invoice: subtotal=3950, gst_amount=711, total=4661
# Calculation: (2000+1500+450) * 1.18 = 3950 * 1.18 = 4661
```

### Step 7: Admin marks invoice paid

```bash
# Get invoice id from the job response above, or:
INV_ID=$(curl -s http://localhost:8000/api/v1/jobs/<JOB_ID> \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python -c "import sys,json; print(json.load(sys.stdin)['invoice']['id'])")

curl -s -X PATCH http://localhost:8000/api/v1/invoices/$INV_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"paid","payment_mode":"card"}'
# → 200 status=paid, payment_mode=card, paid_at=...
```

### Step 8: Customer views completed job and history

```bash
# Job detail (includes items + paid invoice):
curl -s http://localhost:8000/api/v1/jobs/<JOB_ID> \
  -H "Authorization: Bearer $CUST_TOKEN"
# → 200 with 3 items, invoice status=paid

# Service history:
curl -s http://localhost:8000/api/v1/invoices \
  -H "Authorization: Bearer $CUST_TOKEN"
# → 200 with all of this customer's invoices

# Vehicle detail shows the job in history:
curl -s http://localhost:8000/api/v1/vehicles/<VEHICLE_ID> \
  -H "Authorization: Bearer $CUST_TOKEN"
# → 200 with service_jobs array containing this job
```

---

## 5. Role-Scoping Verification

Use these curl commands to verify each role is properly restricted:

```bash
# Customer tries to access admin-only endpoint → 403
curl -s -o /dev/null -w "HTTP %{http_code}" \
  -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"hack","email":"hack@test.com","password":"x","role":"admin"}'
# Expected: 403

# Technician tries to access invoices → 403 or []
curl -s -o /dev/null -w "HTTP %{http_code}" \
  http://localhost:8000/api/v1/invoices \
  -H "Authorization: Bearer $TECH_TOKEN"
# Expected: 200 with [] (empty list)

# Technician tries to reassign a job → 403
curl -s -X PATCH http://localhost:8000/api/v1/jobs/1 \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technician_id":999}'
# Expected: 403 "Only admin can reassign a job"

# Cannot transition completed job backwards → 400
curl -s -X PATCH http://localhost:8000/api/v1/jobs/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"created"}'
# Expected: 400 "Cannot transition from 'completed' to 'created'"

# Cannot delete items from completed job → 400
curl -s -o /dev/null -w "HTTP %{http_code}" \
  -X DELETE http://localhost:8000/api/v1/jobs/1/items/1 \
  -H "Authorization: Bearer $TECH_TOKEN"
# Expected: 400

# Deactivated user cannot log in → 403
curl -s -X PATCH http://localhost:8000/api/v1/users/<USER_ID> \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active":false}'
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<DEACTIVATED_EMAIL>","password":"<PASSWORD>"}'
# Expected: 403 "Account is deactivated"
```

---

## 6. Invoice Calculation Logic

Invoices are auto-generated when a job transitions to `completed`. The calculation:

```
subtotal   = sum of all job_items (quantity × unit_price)
gst_amount = subtotal × 0.18
total      = subtotal + gst_amount
```

**Example:** 3 items with prices 2000 + 1500 + 450 = subtotal 3950

| Field | Value |
|---|---|
| Subtotal | 3950.00 |
| GST (18%) | 711.00 |
| **Total** | **4661.00** |

---

## 7. Shutting Down

```bash
docker compose down         # stop containers, keep data volume
docker compose down -v      # stop + delete data volume (fresh start next time)
```

---

## 8. Full Project vs MVP Feature Map

This MVP implements the smallest slice of the full **GoGarage / AutoServePro** platform that proves the core service-job lifecycle end-to-end. The source documents describe a large multi-location, multi-module garage operating system. The table below shows what was selected for the MVP and what was intentionally deferred.

### 8.1 Features Implemented in This MVP

| Category | Feature | Notes |
|---|---|---|
| **Auth & Roles** | Email + password (JWT), bcrypt hashing | 3 roles: `admin`, `technician`, `customer` |
| **Location** | Single garage / single location | No organisation or multi-branch hierarchy |
| **Registration** | Customer self-registration (`/auth/register`) | Returns JWT immediately after signup |
| **Staff Management** | Admin creates technician/admin accounts | Via `POST /users`; activate/deactivate via `PATCH /users/{id}` |
| **Vehicles** | Manual CRUD for vehicles | Registration number, make, model, year, fuel type |
| **Service Jobs** | Full job-card lifecycle | `created → in_progress → completed` state machine with validation |
| **Job Items** | Technician logs services and parts | Quantity × unit price; add/remove gated by job status |
| **Invoice** | Auto-generated on job completion | Flat 18% GST; subtotal + GST = total |
| **Payment** | Manual payment marking | `cash` / `upi` / `card` labels only (no real payment processing) |
| **Dashboards** | Role-scoped views for all 3 roles | Admin: Kanban board + revenue; Tech: assigned jobs; Customer: vehicles + jobs + history |
| **Status Refresh** | Manual refresh + 10s polling | On job detail pages; no WebSocket |
| **Seed Data** | Demo accounts + vehicle | `python -m app.seed` — idempotent, safe to re-run |
| **Containerization** | Docker Compose (3 services) | PostgreSQL 16 + FastAPI backend + Vite/React frontend |

### 8.2 Features NOT in This MVP (Deferred to Post-MVP)

These are all present in the full GoGarage/AutoServePro source documents but are deliberately excluded so the MVP stays small and demoable. If a feature is on this list, it is a scope decision, not an oversight.

| Category | Excluded Feature | Reason |
|---|---|---|
| **Multi-Location** | Multi-organisation, multi-branch, regional hierarchy | Adds tenancy columns, RLS, and complex role inheritance |
| **Extended Roles** | Super Admin, Regional Manager, Service Manager | MVP only needs 3 roles to demo the core loop |
| **Security** | Row-Level Security (RLS), cross-location data isolation | Single-garage scope makes this unnecessary |
| **Real-Time** | WebSocket live tracker, in-app chat | 10s polling is sufficient for a demo |
| **Background Jobs** | Redis, Celery, background task queue | No async processing needed in this scope |
| **Vehicle Lookup** | Vahan/RC API integration | Vehicles are entered manually |
| **Messaging** | WhatsApp Business API, SMS/OTP gateway, push notifications | Out of scope for demo |
| **Payments** | Payment gateway integration (Razorpay/PhonePe/Pinelabs POS) | Payment status is a manual toggle |
| **Loyalty** | Loyalty & wallet system, referrals | Post-MVP feature |
| **Discounts** | Discount engine, governance/approval workflows | Post-MVP feature |
| **Inventory** | Central warehouse, stock levels, transfers, reorder alerts | No inventory tracking in MVP |
| **CRM** | Leads, complaints, ratings, service reminders | Post-MVP feature |
| **Analytics** | KPI dashboards, trend charts, heatmaps | Admin dashboard shows basic revenue total only |
| **Media** | Photo/video upload, vehicle body condition reports, tyre condition tracking | Not needed for core job flow |
| **Audit** | Audit logs | Post-MVP compliance feature |
| **GST Detail** | CGST/SGST/IGST split | Single flat `gst_percent` field (18%) |
| **Mobile App** | Android app | Web only, responsive |

### 8.3 Data Model — MVP vs Full Platform

The MVP tables are named and structured so that future migration is **additive, not a rewrite**:

| MVP Table | Future (Full Platform) |
|---|---|
| `users` | Gains `organisation_id` FK, `location_id` FK, and 3 additional roles |
| `vehicles` | Gains `organisation_id` FK for cross-location scoping |
| `service_jobs` | Gains `location_id` FK; `status` enum expanded to include `cancelled`, `on_hold` |
| `job_items` | Gains `inventory_item_id` FK for stock deduction; `discount` columns |
| `invoices` | Gains CGST/SGST/IGST split columns; `organisation_id` FK |

### 8.4 Scope Boundary Summary

```
FULL GoGarage/AutoServePro PLATFORM
+──────────────────────────────────────────────────────────────+
│  Multi-location  │ 6 roles │ RLS │ WebSocket │ Payments │ ... │
├──────────────────────────────────────────────────────────────┤
│  THIS MVP                                                     │
│  +──────────────────────────────────────────────────────+    │
│  │ 1 garage │ 3 roles │ JWT │ REST │ 5 tables │ 15 APIs │    │
│  │ Customer → Admin → Tech → Invoice → Paid → History  │    │
│  +──────────────────────────────────────────────────────+    │
│                                                               │
│  DEFERRED (post-MVP)                                          │
│  +──────────────────────────────────────────────────────+    │
│  │ Redis │ Celery │ WhatsApp │ Razorpay │ Inventory │ ... │    │
│  +──────────────────────────────────────────────────────+    │
+──────────────────────────────────────────────────────────────+
```

Every line of code in this MVP maps directly onto a column, table, or endpoint that will exist in the full platform. Nothing was built that would need to be thrown away — the MVP is a proper subset, not a parallel prototype.
