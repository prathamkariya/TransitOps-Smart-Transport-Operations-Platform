"""
reports.py — Analytics reports + mandatory CSV export (Engineer 03 scope).
All four reports + a unified CSV export endpoint.
Business: fuel efficiency uses trip planned_distance / fuel liters per vehicle.
"""
import csv
import io
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.expense import Expense
from app.models.fuel import FuelLog
from app.models.maintenance import MaintenanceLog
from app.models.trip import Trip, TripStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.user import User
from app.schemas.report import (
    FuelEfficiencyRow,
    FleetUtilizationRow,
    OperationalCostRow,
    VehicleROIRow,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_vehicles(db: Session, vehicle_id: Optional[int]) -> List[Vehicle]:
    q = db.query(Vehicle)
    if vehicle_id:
        q = q.filter(Vehicle.id == vehicle_id)
    return q.all()


def _fuel_totals(db: Session, vehicle_id: int, date_from, date_to):
    q = db.query(
        func.coalesce(func.sum(FuelLog.liters), 0.0),
        func.coalesce(func.sum(FuelLog.total_cost), 0.0),
    ).filter(FuelLog.vehicle_id == vehicle_id)
    if date_from:
        q = q.filter(FuelLog.date >= date_from)
    if date_to:
        q = q.filter(FuelLog.date <= date_to)
    return q.first()


def _trip_distance(db: Session, vehicle_id: int, date_from, date_to) -> float:
    q = db.query(func.coalesce(func.sum(Trip.planned_distance), 0.0)).filter(
        Trip.vehicle_id == vehicle_id,
        Trip.status == TripStatus.completed,
    )
    if date_from:
        q = q.filter(Trip.completed_at >= date_from)
    if date_to:
        q = q.filter(Trip.completed_at <= date_to)
    return q.scalar() or 0.0


# ─── Fuel Efficiency ─────────────────────────────────────────────────────────

@router.get("/fuel-efficiency", response_model=List[FuelEfficiencyRow])
def fuel_efficiency_report(
    vehicle_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """km per litre for each vehicle over the selected period."""
    result = []
    for v in _get_vehicles(db, vehicle_id):
        liters, fuel_cost = _fuel_totals(db, v.id, date_from, date_to)
        distance = _trip_distance(db, v.id, date_from, date_to)
        efficiency = round(distance / liters, 2) if liters > 0 else 0.0
        result.append(
            FuelEfficiencyRow(
                vehicle_id=v.id,
                reg_number=v.reg_number,
                model=v.model,
                type=v.type,
                total_distance_km=round(distance, 2),
                total_fuel_liters=round(liters, 2),
                fuel_efficiency_km_per_liter=efficiency,
                total_fuel_cost=round(fuel_cost, 2),
            )
        )
    return result


# ─── Operational Cost ────────────────────────────────────────────────────────

@router.get("/operational-cost", response_model=List[OperationalCostRow])
def operational_cost_report(
    vehicle_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Total operational cost = fuel + maintenance + expenses per vehicle."""
    result = []
    for v in _get_vehicles(db, vehicle_id):
        fuel_q = db.query(func.coalesce(func.sum(FuelLog.total_cost), 0.0)).filter(
            FuelLog.vehicle_id == v.id
        )
        if date_from:
            fuel_q = fuel_q.filter(FuelLog.date >= date_from)
        if date_to:
            fuel_q = fuel_q.filter(FuelLog.date <= date_to)
        fuel_cost = fuel_q.scalar() or 0.0

        maint_q = db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0.0)).filter(
            MaintenanceLog.vehicle_id == v.id
        )
        if date_from:
            maint_q = maint_q.filter(MaintenanceLog.opened_at >= date_from)
        if date_to:
            maint_q = maint_q.filter(MaintenanceLog.opened_at <= date_to)
        maint_cost = maint_q.scalar() or 0.0

        exp_q = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
            Expense.vehicle_id == v.id
        )
        if date_from:
            exp_q = exp_q.filter(Expense.date >= date_from)
        if date_to:
            exp_q = exp_q.filter(Expense.date <= date_to)
        exp_cost = exp_q.scalar() or 0.0

        result.append(
            OperationalCostRow(
                vehicle_id=v.id,
                reg_number=v.reg_number,
                model=v.model,
                type=v.type,
                status=v.status.value,
                total_fuel_cost=round(fuel_cost, 2),
                total_maintenance_cost=round(maint_cost, 2),
                total_expense_cost=round(exp_cost, 2),
                total_operational_cost=round(fuel_cost + maint_cost + exp_cost, 2),
            )
        )
    return result


# ─── Vehicle ROI ─────────────────────────────────────────────────────────────

@router.get("/vehicle-roi", response_model=List[VehicleROIRow])
def vehicle_roi_report(
    vehicle_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """ROI = (Revenue - OperationalCost) / AcquisitionCost × 100"""
    result = []
    for v in _get_vehicles(db, vehicle_id):
        revenue = db.query(func.coalesce(func.sum(Trip.revenue), 0.0)).filter(
            Trip.vehicle_id == v.id,
            Trip.status == TripStatus.completed,
        ).scalar() or 0.0

        fuel_cost = db.query(func.coalesce(func.sum(FuelLog.total_cost), 0.0)).filter(
            FuelLog.vehicle_id == v.id
        ).scalar() or 0.0
        maint_cost = db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0.0)).filter(
            MaintenanceLog.vehicle_id == v.id
        ).scalar() or 0.0
        exp_cost = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
            Expense.vehicle_id == v.id
        ).scalar() or 0.0

        op_cost = fuel_cost + maint_cost + exp_cost
        net_profit = revenue - op_cost
        roi = round((net_profit / v.acquisition_cost * 100) if v.acquisition_cost > 0 else 0.0, 2)

        result.append(
            VehicleROIRow(
                vehicle_id=v.id,
                reg_number=v.reg_number,
                model=v.model,
                acquisition_cost=v.acquisition_cost,
                total_revenue=round(revenue, 2),
                total_operational_cost=round(op_cost, 2),
                net_profit=round(net_profit, 2),
                roi_percentage=roi,
            )
        )
    return result


# ─── Fleet Utilization ───────────────────────────────────────────────────────

@router.get("/fleet-utilization", response_model=List[FleetUtilizationRow])
def fleet_utilization_report(
    vehicle_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Trip count breakdown per vehicle."""
    result = []
    for v in _get_vehicles(db, vehicle_id):
        total = db.query(func.count(Trip.id)).filter(Trip.vehicle_id == v.id).scalar() or 0
        completed = db.query(func.count(Trip.id)).filter(
            Trip.vehicle_id == v.id, Trip.status == TripStatus.completed
        ).scalar() or 0
        active = db.query(func.count(Trip.id)).filter(
            Trip.vehicle_id == v.id, Trip.status == TripStatus.dispatched
        ).scalar() or 0

        result.append(
            FleetUtilizationRow(
                vehicle_id=v.id,
                reg_number=v.reg_number,
                model=v.model,
                type=v.type,
                current_status=v.status.value,
                total_trips=total,
                completed_trips=completed,
                active_trips=active,
            )
        )
    return result


# ─── CSV Export (mandatory per spec) ─────────────────────────────────────────

@router.get("/export/csv")
def export_csv(
    report_type: str = Query(
        ...,
        description="One of: fuel_efficiency | operational_cost | vehicle_roi | fleet_utilization",
    ),
    vehicle_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download any report as a CSV file."""
    dispatch = {
        "fuel_efficiency": lambda: [r.model_dump() for r in fuel_efficiency_report(vehicle_id, date_from, date_to, db, current_user)],
        "operational_cost": lambda: [r.model_dump() for r in operational_cost_report(vehicle_id, date_from, date_to, db, current_user)],
        "vehicle_roi": lambda: [r.model_dump() for r in vehicle_roi_report(vehicle_id, db, current_user)],
        "fleet_utilization": lambda: [r.model_dump() for r in fleet_utilization_report(vehicle_id, db, current_user)],
    }

    if report_type not in dispatch:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown report_type '{report_type}'. Valid: {list(dispatch.keys())}",
        )

    rows = dispatch[report_type]()
    if not rows:
        # Return empty CSV with headers from schema if no data
        schema_map = {
            "fuel_efficiency": FuelEfficiencyRow,
            "operational_cost": OperationalCostRow,
            "vehicle_roi": VehicleROIRow,
            "fleet_utilization": FleetUtilizationRow,
        }
        fieldnames = list(schema_map[report_type].model_fields.keys())
        rows = []
    else:
        fieldnames = list(rows[0].keys())

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    filename = f"{report_type}_{date.today()}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
