from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ....core.db import get_db
from ....models.user import User, UserRole
from ....models.vehicle import VehicleStatus
from ....schemas import VehicleCreate, VehicleUpdate, VehicleStatusUpdate, VehicleResponse
from ....services.fleet import (
    get_vehicles, get_vehicle_by_id,
    create_vehicle, update_vehicle, update_vehicle_status,
)
from app.auth import get_current_user, require_role

router = APIRouter()


@router.get("/", response_model=List[VehicleResponse])
def list_vehicles(
    search: Optional[str] = Query(None, description="Search reg_number or model_name"),
    status: Optional[VehicleStatus] = Query(None),
    v_type: Optional[str] = Query(None, alias="type"),
    region: Optional[str] = Query(None),
    sort_by: str = Query("id", description="Field to sort by"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),  # Any authenticated user
):
    return get_vehicles(db, skip, limit, search, status, v_type, region, sort_by, order)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_vehicle_by_id(db, vehicle_id)


@router.post("/", response_model=VehicleResponse, status_code=201)
def add_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role([UserRole.fleet_manager])),
):
    return create_vehicle(db, data)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def edit_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role([UserRole.fleet_manager])),
):
    return update_vehicle(db, vehicle_id, data)


@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
def change_vehicle_status(
    vehicle_id: int,
    data: VehicleStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role([UserRole.fleet_manager])),
):
    return update_vehicle_status(db, vehicle_id, data)
