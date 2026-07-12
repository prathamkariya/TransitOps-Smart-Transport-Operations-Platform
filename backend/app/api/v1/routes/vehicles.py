from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ...core import db
from ...schemas import VehicleResponse, VehicleCreate
from ...services import fleet as fleet_service
from ..deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[VehicleResponse])
def get_vehicles(skip: int = 0, limit: int = 100, search: str = None, status: str = None, v_type: str = None, db_session: Session = Depends(db.get_db), current_user = Depends(get_current_user)):
    return fleet_service.get_vehicles(db_session, skip=skip, limit=limit, search=search, status=status, v_type=v_type)

@router.post("/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db_session: Session = Depends(db.get_db), current_user = Depends(get_current_user)):
    return fleet_service.create_vehicle(db_session, vehicle)
