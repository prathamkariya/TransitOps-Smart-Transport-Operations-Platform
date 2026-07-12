from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ...core import db
from ...schemas import DriverResponse, DriverCreate
from ...services import fleet as fleet_service
from ..deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[DriverResponse])
def get_drivers(skip: int = 0, limit: int = 100, search: str = None, status: str = None, db_session: Session = Depends(db.get_db), current_user = Depends(get_current_user)):
    return fleet_service.get_drivers(db_session, skip=skip, limit=limit, search=search, status=status)

@router.post("/", response_model=DriverResponse)
def create_driver(driver: DriverCreate, db_session: Session = Depends(db.get_db), current_user = Depends(get_current_user)):
    return fleet_service.create_driver(db_session, driver)
