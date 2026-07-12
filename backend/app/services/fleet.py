from sqlalchemy.orm import Session
from ..models import Vehicle, Driver
from ..schemas import VehicleCreate, VehicleUpdate, DriverCreate, DriverUpdate

# Vehicle Services
def get_vehicles(db: Session, skip: int = 0, limit: int = 100, search: str = None, status: str = None, v_type: str = None):
    query = db.query(Vehicle)
    if search:
        query = query.filter(Vehicle.reg_number.ilike(f"%{search}%") | Vehicle.model.ilike(f"%{search}%"))
    if status:
        query = query.filter(Vehicle.status == status)
    if v_type:
        query = query.filter(Vehicle.type == v_type)
    return query.offset(skip).limit(limit).all()

def create_vehicle(db: Session, vehicle: VehicleCreate):
    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

# Driver Services
def get_drivers(db: Session, skip: int = 0, limit: int = 100, search: str = None, status: str = None):
    query = db.query(Driver)
    if search:
        query = query.filter(Driver.name.ilike(f"%{search}%") | Driver.license_number.ilike(f"%{search}%"))
    if status:
        query = query.filter(Driver.status == status)
    return query.offset(skip).limit(limit).all()

def create_driver(db: Session, driver: DriverCreate):
    db_driver = Driver(**driver.model_dump())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver
