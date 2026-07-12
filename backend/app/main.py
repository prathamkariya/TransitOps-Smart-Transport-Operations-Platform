"""
main.py — FastAPI application entry point (Engineer 03 / DevOps owner).
Responsibilities:
  - Create PostgreSQL enum types (IF NOT EXISTS) before table creation
  - Create all tables via SQLAlchemy metadata
  - Mount all routers under /api/v1
  - Configure CORS for the Vite frontend
"""
import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.database import engine, Base
from app.config import settings

# ── Import all models so Base.metadata is fully populated ───────────────────
import app.models  # noqa: F401 — side-effect import registers all ORM classes

# ── Import routers ───────────────────────────────────────────────────────────
from app.auth import router as auth_router
from app.fuel import router as fuel_router
from app.expenses import router as expense_router
from app.dashboard import router as dashboard_router
from app.reports import router as reports_router

from app.api.v1.routes.vehicles import router as my_vehicles_router
from app.api.v1.routes.drivers import router as my_drivers_router

logger = logging.getLogger("transitops")
logging.basicConfig(level=logging.INFO)


# ── DB setup ─────────────────────────────────────────────────────────────────

def _create_enum_types() -> None:
    """
    Pre-create all PostgreSQL ENUM types with IF NOT EXISTS semantics.
    SQLAlchemy's create_all doesn't support this natively for enums,
    so we use a DO block that swallows 'duplicate_object' errors.
    """
    enum_ddl = [
        "DO $$ BEGIN CREATE TYPE userrole AS ENUM ('fleet_manager','driver','safety_officer','financial_analyst'); EXCEPTION WHEN duplicate_object THEN null; END $$",
        "DO $$ BEGIN CREATE TYPE vehiclestatus AS ENUM ('available','on_trip','in_shop','retired'); EXCEPTION WHEN duplicate_object THEN null; END $$",
        "DO $$ BEGIN CREATE TYPE driverstatus AS ENUM ('available','on_trip','off_duty','suspended'); EXCEPTION WHEN duplicate_object THEN null; END $$",
        "DO $$ BEGIN CREATE TYPE tripstatus AS ENUM ('draft','dispatched','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$",
        "DO $$ BEGIN CREATE TYPE expensetype AS ENUM ('toll','repair','misc'); EXCEPTION WHEN duplicate_object THEN null; END $$",
    ]
    with engine.begin() as conn:
        for stmt in enum_ddl:
            conn.execute(text(stmt))


def setup_database(max_retries: int = 10, delay: float = 3.0) -> None:
    """
    Wait for Postgres to be ready (container restart race), create enum types,
    then create all tables. Uses create_all(checkfirst=True) so re-runs are safe.
    """
    for attempt in range(1, max_retries + 1):
        try:
            _create_enum_types()
            Base.metadata.create_all(bind=engine, checkfirst=True)
            logger.info("✅ Database schema ready")
            return
        except OperationalError as exc:
            logger.warning(
                "⏳ Postgres not ready yet (attempt %d/%d): %s", attempt, max_retries, exc
            )
            time.sleep(delay)
    raise RuntimeError("Could not connect to Postgres after multiple retries — aborting startup")


# ── App lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_database()
    yield
    # Nothing to clean up for now


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="TransitOps API",
    description=(
        "Smart Transport Operations Platform — "
        "fleet management, dispatch, fuel tracking, analytics."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow Vite dev server and any potential production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://transitops-frontend:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

PREFIX = "/api/v1"

app.include_router(auth_router, prefix=PREFIX)
app.include_router(fuel_router, prefix=PREFIX)
app.include_router(expense_router, prefix=PREFIX)
app.include_router(dashboard_router, prefix=PREFIX)
app.include_router(reports_router, prefix=PREFIX)

# New Phase 1 endpoints
app.include_router(my_vehicles_router, prefix=PREFIX + "/vehicles", tags=["Vehicles"])
app.include_router(my_drivers_router, prefix=PREFIX + "/drivers", tags=["Drivers"])


# ── Health ───────────────────────────────────────────────────────────────────

@app.get(f"{PREFIX}/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "TransitOps API", "version": "1.0.0"}


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "TransitOps API is running",
        "docs": "/docs",
        "health": f"{PREFIX}/health",
    }
