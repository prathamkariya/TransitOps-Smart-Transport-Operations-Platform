from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.vehicle import Vehicle, VehicleStatus
from ..models.driver import Driver, DriverStatus
from ..schemas import (
    VehicleCreate, VehicleUpdate, VehicleStatusUpdate,
    DriverCreate, DriverUpdate, DriverStatusUpdate,
    DriverResponse,
)


# ── Vehicle Services ───────────────────────────────────────────────────────────

def get_vehicles(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[VehicleStatus] = None,
    v_type: Optional[str] = None,
    region: Optional[str] = None,
    sort_by: str = "id",
    order: str = "asc",
):
    query = db.query(Vehicle)
    if search:
        query = query.filter(
            Vehicle.reg_number.ilike(f"%{search}%") |
            Vehicle.model_name.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(Vehicle.status == status)
    if v_type:
        query = query.filter(Vehicle.type.ilike(f"%{v_type}%"))
    if region:
        query = query.filter(Vehicle.region.ilike(f"%{region}%"))

    sort_column = getattr(Vehicle, sort_by, Vehicle.id)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    return query.offset(skip).limit(limit).all()


def get_vehicle_by_id(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return vehicle


def create_vehicle(db: Session, data: VehicleCreate) -> Vehicle:
    existing = db.query(Vehicle).filter(Vehicle.reg_number == data.reg_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Vehicle with reg_number '{data.reg_number}' already exists",
        )
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def update_vehicle(db: Session, vehicle_id: int, data: VehicleUpdate) -> Vehicle:
    vehicle = get_vehicle_by_id(db, vehicle_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def update_vehicle_status(db: Session, vehicle_id: int, data: VehicleStatusUpdate) -> Vehicle:
    vehicle = get_vehicle_by_id(db, vehicle_id)
    vehicle.status = data.status
    db.commit()
    db.refresh(vehicle)
    return vehicle


# ── Driver Services ────────────────────────────────────────────────────────────

def get_drivers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[DriverStatus] = None,
    license_category: Optional[str] = None,
    sort_by: str = "id",
    order: str = "asc",
):
    query = db.query(Driver)
    if search:
        query = query.filter(
            Driver.name.ilike(f"%{search}%") |
            Driver.license_number.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(Driver.status == status)
    if license_category:
        query = query.filter(Driver.license_category.ilike(f"%{license_category}%"))

    sort_column = getattr(Driver, sort_by, Driver.id)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    return query.offset(skip).limit(limit).all()


def get_driver_by_id(db: Session, driver_id: int) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver {driver_id} not found")
    return driver


def create_driver(db: Session, data: DriverCreate) -> Driver:
    existing = db.query(Driver).filter(Driver.license_number == data.license_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driver with license_number '{data.license_number}' already exists",
        )
    driver = Driver(**data.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def update_driver(db: Session, driver_id: int, data: DriverUpdate) -> Driver:
    driver = get_driver_by_id(db, driver_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver


def update_driver_status(db: Session, driver_id: int, data: DriverStatusUpdate) -> Driver:
    driver = get_driver_by_id(db, driver_id)
    driver.status = data.status
    db.commit()
    db.refresh(driver)
    return driver
