from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ....core.db import get_db
from ....models.user import User, RoleEnum
from ....models.driver import DriverStatusEnum
from ....schemas import DriverCreate, DriverUpdate, DriverStatusUpdate, DriverResponse
from ....services.fleet import (
    get_drivers, get_driver_by_id,
    create_driver, update_driver, update_driver_status,
)
from ...deps import get_current_user, require_role

router = APIRouter()


@router.get("/", response_model=List[DriverResponse])
def list_drivers(
    search: Optional[str] = Query(None, description="Search name or license_number"),
    status: Optional[DriverStatusEnum] = Query(None),
    license_category: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    drivers = get_drivers(db, skip, limit, search, status, license_category, sort_by, order)
    return [DriverResponse.from_orm_with_computed(d) for d in drivers]


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    driver = get_driver_by_id(db, driver_id)
    return DriverResponse.from_orm_with_computed(driver)


@router.post("/", response_model=DriverResponse, status_code=201)
def add_driver(
    data: DriverCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(RoleEnum.fleet_manager, RoleEnum.safety_officer)),
):
    driver = create_driver(db, data)
    return DriverResponse.from_orm_with_computed(driver)


@router.put("/{driver_id}", response_model=DriverResponse)
def edit_driver(
    driver_id: int,
    data: DriverUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(RoleEnum.fleet_manager, RoleEnum.safety_officer)),
):
    driver = update_driver(db, driver_id, data)
    return DriverResponse.from_orm_with_computed(driver)


@router.patch("/{driver_id}/status", response_model=DriverResponse)
def change_driver_status(
    driver_id: int,
    data: DriverStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(RoleEnum.fleet_manager, RoleEnum.safety_officer)),
):
    driver = update_driver_status(db, driver_id, data)
    return DriverResponse.from_orm_with_computed(driver)
