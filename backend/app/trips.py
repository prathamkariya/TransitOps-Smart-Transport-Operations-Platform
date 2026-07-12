# Engineer 2 - Trips (Routes + Service layer)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime, timezone
from typing import List

from app.database import get_db
from app.schemas.trip import TripCreate, TripResponse
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.fuel import FuelLog

trips_router = APIRouter(prefix="/trips", tags=["Trips"])

class TripService:
    @staticmethod
    def get_trip(db: Session, trip_id: int):
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        return trip

    @staticmethod
    def create_trip(db: Session, trip_data: TripCreate):
        # Validate that vehicle and driver exist
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip_data.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        driver = db.query(Driver).filter(Driver.id == trip_data.driver_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")

        # Initial trip status must be draft
        db_trip = Trip(
            source=trip_data.source,
            destination=trip_data.destination,
            vehicle_id=trip_data.vehicle_id,
            driver_id=trip_data.driver_id,
            cargo_weight=trip_data.cargo_weight,
            planned_distance=trip_data.distance,
            status="draft"
        )
        db.add(db_trip)
        db.commit()
        db.refresh(db_trip)
        return db_trip

    @staticmethod
    def dispatch_trip(db: Session, trip_id: int):
        trip = TripService.get_trip(db, trip_id)
        if trip.status != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only draft trips can be dispatched. Current status: {trip.status}"
            )

        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

        if not vehicle or not driver:
            raise HTTPException(status_code=404, detail="Vehicle or Driver associated with the trip is missing")

        # Business Rule 1: Retired or In Shop vehicles must never be dispatched
        if vehicle.status in ["retired", "in_shop"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot dispatch trip: Vehicle is {vehicle.status}"
            )

        # Business Rule 2: Drivers with expired licenses or Suspended status cannot be assigned
        if driver.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot dispatch trip: Driver is suspended"
            )
        if driver.license_expiry and driver.license_expiry < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot dispatch trip: Driver's license has expired"
            )

        # Business Rule 3: Already On Trip checks
        if vehicle.status == "on_trip":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot dispatch trip: Vehicle is already on another trip"
            )
        if driver.status == "on_trip":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot dispatch trip: Driver is already on another trip"
            )

        # Business Rule 4: Cargo weight must not exceed vehicle's max capacity
        if trip.cargo_weight > vehicle.max_load_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cargo weight ({trip.cargo_weight} kg) exceeds vehicle maximum capacity ({vehicle.max_load_capacity} kg)"
            )

        # Transition status
        trip.status = "dispatched"
        trip.dispatched_at = datetime.now(timezone.utc)
        vehicle.status = "on_trip"
        driver.status = "on_trip"

        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def complete_trip(db: Session, trip_id: int, final_odometer: float, fuel_consumed_liters: float = None, fuel_cost: float = None):
        trip = TripService.get_trip(db, trip_id)
        if trip.status != "dispatched":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only dispatched trips can be completed. Current status: {trip.status}"
            )

        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

        if final_odometer < vehicle.odometer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Final odometer reading ({final_odometer}) cannot be less than current odometer ({vehicle.odometer})"
            )

        vehicle.odometer = final_odometer
        trip.status = "completed"
        trip.completed_at = datetime.now(timezone.utc)
        vehicle.status = "available"
        driver.status = "available"

        # Record fuel log if provided
        if fuel_consumed_liters is not None and fuel_consumed_liters > 0:
            cost_per_liter = (fuel_cost / fuel_consumed_liters) if fuel_cost and fuel_consumed_liters > 0 else 0.0
            db_fuel_log = FuelLog(
                vehicle_id=trip.vehicle_id,
                liters=fuel_consumed_liters,
                cost_per_liter=cost_per_liter,
                total_cost=fuel_cost or 0.0,
                date=date.today()
            )
            db.add(db_fuel_log)

        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def cancel_trip(db: Session, trip_id: int):
        trip = TripService.get_trip(db, trip_id)
        if trip.status != "dispatched":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only dispatched trips can be cancelled. Current status: {trip.status}"
            )

        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

        trip.status = "cancelled"
        if vehicle.status == "on_trip":
            vehicle.status = "available"
        if driver.status == "on_trip":
            driver.status = "available"

        db.commit()
        db.refresh(trip)
        return trip

@trips_router.get("/", response_model=List[TripResponse])
def list_trips(db: Session = Depends(get_db)):
    return db.query(Trip).order_by(Trip.id.desc()).all()

@trips_router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    return TripService.get_trip(db=db, trip_id=trip_id)

@trips_router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(trip_in: TripCreate, db: Session = Depends(get_db)):
    return TripService.create_trip(db=db, trip_data=trip_in)

@trips_router.post("/{trip_id}/dispatch", response_model=TripResponse)
def dispatch_trip(trip_id: int, db: Session = Depends(get_db)):
    return TripService.dispatch_trip(db=db, trip_id=trip_id)

@trips_router.post("/{trip_id}/complete", response_model=TripResponse)
def complete_trip(
    trip_id: int,
    final_odometer: float,
    fuel_consumed_liters: float = None,
    fuel_cost: float = None,
    db: Session = Depends(get_db)
):
    return TripService.complete_trip(
        db=db,
        trip_id=trip_id,
        final_odometer=final_odometer,
        fuel_consumed_liters=fuel_consumed_liters,
        fuel_cost=fuel_cost
    )

@trips_router.post("/{trip_id}/cancel", response_model=TripResponse)
def cancel_trip(trip_id: int, db: Session = Depends(get_db)):
    return TripService.cancel_trip(db=db, trip_id=trip_id)
