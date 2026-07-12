"""
dashboard.py — Fleet KPI aggregation endpoint (Engineer 03 scope).
Single endpoint that returns all dashboard data in one round-trip.
License expiry alerts are built in (Tier 1 bonus — zero extra infra, in-app only).
"""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.driver import Driver, DriverStatus
from app.models.maintenance import MaintenanceLog
from app.models.trip import Trip, TripStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Returns all KPI data the dashboard needs in a single query round-trip.
    Includes in-app expiry alerts (licenses expiring within 7 days).
    """
    today = date.today()
    alert_window = today + timedelta(days=7)

    # ── Vehicle counts ──────────────────────────────────────────────────────
    total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0
    available_vehicles = db.query(func.count(Vehicle.id)).filter(
        Vehicle.status == VehicleStatus.available
    ).scalar() or 0
    on_trip_vehicles = db.query(func.count(Vehicle.id)).filter(
        Vehicle.status == VehicleStatus.on_trip
    ).scalar() or 0
    in_shop_vehicles = db.query(func.count(Vehicle.id)).filter(
        Vehicle.status == VehicleStatus.in_shop
    ).scalar() or 0
    retired_vehicles = db.query(func.count(Vehicle.id)).filter(
        Vehicle.status == VehicleStatus.retired
    ).scalar() or 0

    operational = total_vehicles - retired_vehicles
    fleet_utilization_pct = round(
        (on_trip_vehicles / operational * 100) if operational > 0 else 0.0, 1
    )

    # ── Trip counts ─────────────────────────────────────────────────────────
    active_trips = db.query(func.count(Trip.id)).filter(
        Trip.status == TripStatus.dispatched
    ).scalar() or 0
    pending_trips = db.query(func.count(Trip.id)).filter(
        Trip.status == TripStatus.draft
    ).scalar() or 0
    completed_trips = db.query(func.count(Trip.id)).filter(
        Trip.status == TripStatus.completed
    ).scalar() or 0

    # ── Driver counts ───────────────────────────────────────────────────────
    total_drivers = db.query(func.count(Driver.id)).scalar() or 0
    drivers_on_duty = db.query(func.count(Driver.id)).filter(
        Driver.status == DriverStatus.on_trip
    ).scalar() or 0
    available_drivers = db.query(func.count(Driver.id)).filter(
        Driver.status == DriverStatus.available
    ).scalar() or 0

    # ── License expiry alerts (Tier 1 in-app alert) ─────────────────────────
    expiring_soon = db.query(Driver).filter(
        and_(
            Driver.license_expiry >= today,
            Driver.license_expiry <= alert_window,
        )
    ).all()

    already_expired = db.query(Driver).filter(
        Driver.license_expiry < today
    ).all()

    # ── Open maintenance records ─────────────────────────────────────────────
    open_maintenance = db.query(MaintenanceLog).filter(
        MaintenanceLog.closed_at.is_(None)
    ).all()

    return {
        "vehicles": {
            "total": total_vehicles,
            "available": available_vehicles,
            "on_trip": on_trip_vehicles,
            "in_maintenance": in_shop_vehicles,
            "retired": retired_vehicles,
            "fleet_utilization_pct": fleet_utilization_pct,
        },
        "trips": {
            "active": active_trips,
            "pending": pending_trips,
            "completed": completed_trips,
        },
        "drivers": {
            "total": total_drivers,
            "on_duty": drivers_on_duty,
            "available": available_drivers,
        },
        "alerts": {
            "licenses_expiring_soon": [
                {
                    "id": d.id,
                    "name": d.name,
                    "license_number": d.license_number,
                    "license_expiry": d.license_expiry.isoformat(),
                    "days_until_expiry": (d.license_expiry - today).days,
                }
                for d in expiring_soon
            ],
            "licenses_expired": [
                {
                    "id": d.id,
                    "name": d.name,
                    "license_number": d.license_number,
                    "license_expiry": d.license_expiry.isoformat(),
                    "days_overdue": (today - d.license_expiry).days,
                }
                for d in already_expired
            ],
            "vehicles_in_maintenance": [
                {
                    "id": m.id,
                    "vehicle_id": m.vehicle_id,
                    "type": m.type,
                    "opened_at": m.opened_at.isoformat(),
                }
                for m in open_maintenance
            ],
        },
    }
