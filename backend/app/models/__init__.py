<<<<<<< HEAD
# Import all models here so Alembic's env.py can discover them via Base.metadata
from ..core.db import Base  # noqa: F401 — Base must be imported before models
from .user import User  # noqa: F401
from .vehicle import Vehicle  # noqa: F401
from .driver import Driver  # noqa: F401
from .trip import Trip  # noqa: F401
from .maintenance import MaintenanceLog  # noqa: F401
from .fuel import FuelLog  # noqa: F401
from .expense import Expense  # noqa: F401
=======
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
>>>>>>> origin/main
