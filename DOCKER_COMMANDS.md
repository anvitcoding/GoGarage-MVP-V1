# Docker Commands Reference — GoGarage MVP

All commands assume you're running them from the repo root (`C:\Career\GoGarage\V1\DeepSeeek-MVP-1`).

---

## Start / Stop

```bash
# Start everything (db, backend, frontend) — first time or after code changes that need a rebuild
docker compose up --build

# Start in background (detached)
docker compose up -d

# Stop all services (keeps data volumes)
docker compose down

# Stop all services AND wipe the database volume (fresh start)
docker compose down -v
```

---

## Restart Individual Services

```bash
# Restart backend (e.g., after installing a new Python package)
docker compose restart backend

# Restart frontend (e.g., after npm install / weird Vite HMR state)
docker compose restart frontend

# Restart the database
docker compose restart db
```

---

## View Logs

```bash
# Tail logs for all services
docker compose logs -f

# Tail logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Show last 100 lines
docker compose logs --tail=100 backend
```

---

## Database (`db`)

### Interactive psql shell

```bash
docker compose exec db psql -U gogarage -d gogarage
```

### Run a single query from the command line

```bash
docker compose exec db psql -U gogarage -d gogarage -c "SELECT * FROM users;"
```

### Useful psql commands (inside the shell)

```
\dt               — list all tables
\d users          — describe the users table
\du               — list database users/roles
\dn               — list schemas
\q                — quit
```

### Seed data (demo accounts)

```bash
docker compose exec backend python -m app.seed
```

---

## Backend

### Apply Alembic migrations

```bash
docker compose exec backend alembic upgrade head

# If the container was just built for the first time and tables don't exist:
docker compose exec backend alembic stamp head   # mark current model state as applied
```

### Create a new migration after changing models

```bash
docker compose exec backend alembic revision --autogenerate -m "describe_your_change"
```

### Open a Python shell inside the backend container

```bash
docker compose exec backend python
```

### Run backend tests (if any)

```bash
docker compose exec backend pytest
```

---

## Frontend

### Open a shell inside the frontend container

```bash
docker compose exec frontend sh
```

### Install a new npm package

```bash
docker compose exec frontend npm install <package-name>
```

### Run a build (production check)

```bash
docker compose exec frontend npm run build
```

---

## Full Reset (clean slate)

```bash
# 1. Tear everything down including volumes
docker compose down -v

# 2. Rebuild and start
docker compose up --build

# 3. In a separate terminal, apply migrations and seed
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

---

## Quick Cheat Sheet

| Task | Command |
|---|---|
| Start everything | `docker compose up -d` |
| Stop everything | `docker compose down` |
| Restart backend | `docker compose restart backend` |
| Restart frontend | `docker compose restart frontend` |
| DB shell | `docker compose exec db psql -U gogarage -d gogarage` |
| Run migrations | `docker compose exec backend alembic upgrade head` |
| Seed demo data | `docker compose exec backend python -m app.seed` |
| Backend logs | `docker compose logs -f backend` |
| Frontend logs | `docker compose logs -f frontend` |
| Full rebuild | `docker compose up --build` |
| Nuke & restart | `docker compose down -v && docker compose up --build` |

---

## Demo Logins (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@gogarage.com` | `admin123` |
| Technician | `tech@gogarage.com` | `tech123` |
| Customer | `customer@gogarage.com` | `customer123` |
