# Import all models here so Alembic's env.py can discover them via Base.metadata
from ..core.db import Base  # noqa: F401 — Base must be imported before models
from .user import User  # noqa: F401
from .vehicle import Vehicle  # noqa: F401
from .driver import Driver  # noqa: F401
from .trip import Trip  # noqa: F401
from .maintenance import MaintenanceLog  # noqa: F401
from .fuel import FuelLog  # noqa: F401
from .expense import Expense  # noqa: F401
