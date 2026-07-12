# Import all models here so SQLAlchemy's Base.metadata is fully populated
# before create_all() is called in main.py
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.driver import Driver, DriverStatus
from app.models.trip import Trip, TripStatus
from app.models.maintenance import MaintenanceLog
from app.models.fuel import FuelLog
from app.models.expense import Expense, ExpenseType

__all__ = [
    "User", "UserRole",
    "Vehicle", "VehicleStatus",
    "Driver", "DriverStatus",
    "Trip", "TripStatus",
    "MaintenanceLog",
    "FuelLog",
    "Expense", "ExpenseType",
]
