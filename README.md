# TransitOps

**Smart Transport Operations Platform** — built for the Odoo Hiring Hackathon (Virtual Round)

TransitOps replaces spreadsheets and paper logbooks with a centralized platform that manages the full lifecycle of transport operations: vehicle registration → driver management → trip dispatch → maintenance → fuel/expense logging → analytics. The core value isn't any single screen — it's that vehicle and driver status are wired together across every module, so the system itself enforces business rules instead of relying on someone to remember them.

---

## Problem It Solves

| Failure mode (spreadsheet-based ops) | How TransitOps fixes it |
|---|---|
| Double-booked vehicles/drivers | Status locks enforced at the service layer, not just the UI |
| Underutilized fleet | Real-time dashboard KPIs on utilization |
| Missed maintenance | Maintenance state is tied directly to vehicle status |
| Expired driver licenses | Dispatch is blocked automatically if a license is expired |
| Untracked operating costs | Fuel + maintenance costs roll up to a per-vehicle total automatically |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Charts | Recharts |
| Backend | FastAPI |
| ORM / Migrations | SQLAlchemy + Alembic |
| Database | PostgreSQL (enum-typed status fields) |
| Auth | JWT + role claim, bcrypt-hashed passwords |
| Containerization | Docker + Docker Compose |

No third-party BaaS (Firebase/Supabase/Mongo Atlas) — file storage is a local Docker volume, notifications are in-app, no external SMTP.

---

## Roles

| Role | Responsibility |
|---|---|
| **Fleet Manager** | Oversees fleet assets, maintenance, vehicle lifecycle |
| **Driver** | Creates trips, assigns vehicles/drivers, monitors deliveries |
| **Safety Officer** | Tracks license validity and safety scores |
| **Financial Analyst** | Reviews expenses, fuel costs, profitability |

---

## Core Features

- Email/password auth with Role-Based Access Control
- Dashboard: active/available vehicles, vehicles in maintenance, active/pending trips, drivers on duty, fleet utilization %
- Vehicle Registry (CRUD) — unique reg number, type, load capacity, odometer, acquisition cost
- Driver Management (CRUD) — license tracking, safety score, status
- Trip lifecycle: `Draft → Dispatched → Completed → Cancelled`
- Maintenance logging — auto-locks vehicle status to `In Shop`
- Fuel & expense logging with auto-computed operational cost
- Reports: fuel efficiency, fleet utilization, operational cost, Vehicle ROI, CSV export
- **Bonus:** search/filter/sort on all lists, dark mode, in-app license/maintenance expiry alerts

---

## Business Rules (enforced server-side, not just in the UI)

1. Vehicle registration number is unique (DB constraint)
2. `Retired` / `In Shop` vehicles never appear in dispatch selection
3. Expired-license or `Suspended` drivers cannot be assigned to trips
4. A vehicle or driver already `On Trip` cannot be double-booked
5. Cargo weight must not exceed the vehicle's max load capacity
6. Dispatching a trip → vehicle & driver both become `On Trip`
7. Completing a trip → vehicle & driver both return to `Available`
8. Cancelling a dispatched trip → vehicle & driver restored to `Available`
9. Opening maintenance → vehicle becomes `In Shop`
10. Closing maintenance → vehicle restored to `Available` (unless `Retired`)

---

## Project Structure

```
transitops/
├── backend/
│   └── app/
│       ├── core/               # config, security, db (shared)
│       ├── models/             # SQLAlchemy models — one file per entity
│       ├── schemas/            # Pydantic request/response schemas
│       ├── api/v1/routes/      # auth, vehicles, drivers, trips, maintenance, fuel, reports, dashboard
│       ├── services/           # business logic — mirrors routes/
│       └── utils/
│   ├── alembic/                # migrations
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── api/                # axios client + per-domain wrappers
│       ├── components/         # shared UI (Table, Modal, StatusBadge, KPICard)
│       ├── features/           # one folder per domain
│       └── context/            # AuthContext, ThemeContext
├── docker-compose.yml
└── docker-compose.override.yml # local dev overrides
```

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Local Development

```bash
# 1. Start Postgres in Docker
docker-compose up postgres

# 2. Backend (in backend/)
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend (in frontend/)
npm install
npm run dev
```

### Full Stack via Docker Compose

```bash
docker-compose up --build
```

---

## Data Model

| Entity | Notes |
|---|---|
| `users` | role ∈ {fleet_manager, driver, safety_officer, financial_analyst} |
| `vehicles` | status ∈ {available, on_trip, in_shop, retired} |
| `drivers` | status ∈ {available, on_trip, off_duty, suspended} |
| `trips` | status ∈ {draft, dispatched, completed, cancelled} |
| `maintenance_logs` | open record ⇒ vehicle in_shop |
| `fuel_logs` | liters, cost, date |
| `expenses` | tolls, misc, per vehicle |
| `vehicle_documents` | *(bonus)* local volume path, not external storage |

All status fields are Postgres enums, not free-text strings.

---

## Team & Ownership

| Engineer | Domain | Owns |
|---|---|---|
| **Engineer 01 — Fleet & Access** | Auth, Vehicles, Drivers | `auth.py`, `vehicles.py`, `drivers.py`, all of `models/` & `alembic/` |
| **Engineer 02 — Dispatch Core** | Trips, Maintenance | `trips.py`, `maintenance.py` (routes + services) |
| **Engineer 03 — Money & Visibility** | Fuel, Expenses, Dashboard, Reports, DevOps | `fuel.py`, `expenses.py`, `reports.py`, `dashboard.py`, Docker & deploy |

`models/` and Alembic migrations are owned exclusively by Engineer 01 — schema changes go through a request, never a direct edit by another engineer.

---

## License

Built for the Odoo Hiring Hackathon. Not licensed for external distribution.
