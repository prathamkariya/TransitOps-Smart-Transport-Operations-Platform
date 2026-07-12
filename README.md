# TransitOps — Engineer 01 Service (Auth · Fleet · Drivers)

## Stack
- **Backend:** FastAPI + SQLAlchemy 2.0 + Alembic
- **Database:** PostgreSQL 15 (via Docker)
- **Auth:** JWT (HS256) + bcrypt passwords

---

## Quick Start

### 1. Start the database
```bash
docker compose up -d
```

### 2. Set up the Python environment
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your actual values if needed
```

### 4. Run database migrations
```bash
# First time only — initialise Alembic versions folder:
# alembic init alembic  (already done — skip this)

alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

### 5. Seed demo users
```bash
python seed.py
```

### 6. Start the API server
```bash
uvicorn app.main:app --reload --port 8000
```

### 7. Open the interactive API docs
Visit: http://localhost:8000/docs

---

## Demo Credentials (from seed.py)

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleet.manager@demo.com | Demo@1234 |
| Driver | driver@demo.com | Demo@1234 |
| Safety Officer | safety.officer@demo.com | Demo@1234 |
| Financial Analyst | analyst@demo.com | Demo@1234 |

---

## Key Endpoints (Engineer 01 scope)

| Method | Path | Auth |
|---|---|---|
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/auth/me` | Any authenticated |
| GET | `/api/v1/vehicles` | Any authenticated |
| POST | `/api/v1/vehicles` | fleet_manager only |
| GET | `/api/v1/vehicles/{id}` | Any authenticated |
| PUT | `/api/v1/vehicles/{id}` | fleet_manager only |
| PATCH | `/api/v1/vehicles/{id}/status` | fleet_manager only |
| GET | `/api/v1/drivers` | Any authenticated |
| POST | `/api/v1/drivers` | fleet_manager / safety_officer |
| GET | `/api/v1/drivers/{id}` | Any authenticated |
| PUT | `/api/v1/drivers/{id}` | fleet_manager / safety_officer |
| PATCH | `/api/v1/drivers/{id}/status` | fleet_manager / safety_officer |
