"""
fuel.py — Fuel log CRUD endpoints (Engineer 03 scope).
Business rule: total_cost is computed server-side (liters × cost_per_liter).
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.fuel import FuelLog
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.fuel import FuelLogCreate, FuelLogUpdate, FuelLogResponse

router = APIRouter(prefix="/fuel", tags=["Fuel"])


# ─── Create ──────────────────────────────────────────────────────────────────

@router.post("/", response_model=FuelLogResponse, status_code=201)
def create_fuel_log(
    payload: FuelLogCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Business rule: total cost is always computed here — never accepted from client
    total_cost = round(payload.liters * payload.cost_per_liter, 2)

    log = FuelLog(
        vehicle_id=payload.vehicle_id,
        liters=payload.liters,
        cost_per_liter=payload.cost_per_liter,
        total_cost=total_cost,
        odometer_reading=payload.odometer_reading,
        date=payload.date,
        notes=payload.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ─── List ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[FuelLogResponse])
def list_fuel_logs(
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(FuelLog)
    if vehicle_id:
        q = q.filter(FuelLog.vehicle_id == vehicle_id)
    if date_from:
        q = q.filter(FuelLog.date >= date_from)
    if date_to:
        q = q.filter(FuelLog.date <= date_to)
    return q.order_by(FuelLog.date.desc()).offset(skip).limit(limit).all()


# ─── Get one ─────────────────────────────────────────────────────────────────

@router.get("/{fuel_id}", response_model=FuelLogResponse)
def get_fuel_log(
    fuel_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    log = db.query(FuelLog).filter(FuelLog.id == fuel_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    return log


# ─── Update ──────────────────────────────────────────────────────────────────

@router.patch("/{fuel_id}", response_model=FuelLogResponse)
def update_fuel_log(
    fuel_id: int,
    payload: FuelLogUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    log = db.query(FuelLog).filter(FuelLog.id == fuel_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)

    # Recompute total if liters or cost changed
    if "liters" in update_data or "cost_per_liter" in update_data:
        log.total_cost = round(log.liters * log.cost_per_liter, 2)

    db.commit()
    db.refresh(log)
    return log


# ─── Delete ──────────────────────────────────────────────────────────────────

@router.delete("/{fuel_id}", status_code=204)
def delete_fuel_log(
    fuel_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    log = db.query(FuelLog).filter(FuelLog.id == fuel_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    db.delete(log)
    db.commit()
