# Engineer 2 - Maintenance (Routes + Service layer)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.database import get_db
from app.schemas.maintenance import MaintenanceLogCreate, MaintenanceLogResponse
from app.models.maintenance import MaintenanceLog
from app.models.vehicle import Vehicle

maintenance_router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

class MaintenanceService:
    @staticmethod
    def get_log(db: Session, log_id: int):
        log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="Maintenance log not found")
        return log

    @staticmethod
    def create_maintenance_log(db: Session, log_data: MaintenanceLogCreate):
        vehicle = db.query(Vehicle).filter(Vehicle.id == log_data.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        # Business Rule: Vehicle must not be on a trip to undergo maintenance
        if vehicle.status == "on_trip":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot put a vehicle in maintenance while it is on a trip"
            )

        # Create active log
        db_log = MaintenanceLog(
            vehicle_id=log_data.vehicle_id,
            type=log_data.type,
            cost=log_data.cost or 0.0,
            opened_at=datetime.utcnow(),
            closed_at=None
        )
        db.add(db_log)
        vehicle.status = "in_shop"

        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    def close_maintenance_log(db: Session, log_id: int, final_cost: float = None, notes: str = None):
        log = MaintenanceService.get_log(db, log_id)
        if log.closed_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This maintenance log is already closed"
            )

        vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
        log.closed_at = datetime.utcnow()
        if final_cost is not None:
            log.cost = final_cost
        if notes is not None and hasattr(log, 'notes'):
            log.notes = notes

        # Business Rule: Closing maintenance restores the vehicle to Available (unless retired)
        if vehicle and vehicle.status == "in_shop":
            vehicle.status = "available"

        db.commit()
        db.refresh(log)
        return log


# ─── Routes ───────────────────────────────────────────────────────────────────

@maintenance_router.get("/", response_model=List[MaintenanceLogResponse])
def list_maintenance_logs(
    vehicle_id: Optional[int] = None,
    open_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    q = db.query(MaintenanceLog)
    if vehicle_id:
        q = q.filter(MaintenanceLog.vehicle_id == vehicle_id)
    if open_only is True:
        q = q.filter(MaintenanceLog.closed_at.is_(None))
    elif open_only is False:
        q = q.filter(MaintenanceLog.closed_at.isnot(None))
    return q.order_by(MaintenanceLog.id.desc()).all()


@maintenance_router.get("/{log_id}", response_model=MaintenanceLogResponse)
def get_maintenance_log(log_id: int, db: Session = Depends(get_db)):
    return MaintenanceService.get_log(db=db, log_id=log_id)


@maintenance_router.post("/", response_model=MaintenanceLogResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_log(log_in: MaintenanceLogCreate, db: Session = Depends(get_db)):
    return MaintenanceService.create_maintenance_log(db=db, log_data=log_in)


@maintenance_router.patch("/{log_id}/close", response_model=MaintenanceLogResponse)
def close_maintenance_log(
    log_id: int,
    final_cost: float = None,
    notes: str = None,
    db: Session = Depends(get_db)
):
    return MaintenanceService.close_maintenance_log(db=db, log_id=log_id, final_cost=final_cost, notes=notes)
