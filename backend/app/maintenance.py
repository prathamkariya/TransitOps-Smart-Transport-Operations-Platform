# Engineer 2 - Maintenance (Routes + Service layer)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

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
    def close_maintenance_log(db: Session, log_id: int, final_cost: float = None):
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

        # Business Rule: Closing maintenance restores the vehicle to Available (unless retired)
        if vehicle:
            if vehicle.status == "in_shop":
                # Ensure we don't overwrite if it was retired during maintenance
                if vehicle.status != "retired":
                    vehicle.status = "available"

        db.commit()
        db.refresh(log)
        return log

@maintenance_router.post("/", response_model=MaintenanceLogResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_log(log_in: MaintenanceLogCreate, db: Session = Depends(get_db)):
    return MaintenanceService.create_maintenance_log(db=db, log_data=log_in)

@maintenance_router.post("/{log_id}/close", response_model=MaintenanceLogResponse)
def close_maintenance_log(log_id: int, final_cost: float = None, db: Session = Depends(get_db)):
    return MaintenanceService.close_maintenance_log(db=db, log_id=log_id, final_cost=final_cost)
