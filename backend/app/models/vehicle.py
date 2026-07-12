import enum
<<<<<<< HEAD

from sqlalchemy import Column, DateTime, Enum, Float, Index, Integer, String
from sqlalchemy.sql import func

from ..core.db import Base


class VehicleStatusEnum(str, enum.Enum):
=======
from sqlalchemy import Column, Integer, String, Float, Enum as SAEnum, DateTime
from sqlalchemy.sql import func
from app.database import Base


class VehicleStatus(str, enum.Enum):
>>>>>>> origin/main
    available = "available"
    on_trip = "on_trip"
    in_shop = "in_shop"
    retired = "retired"


<<<<<<< HEAD
=======
class VehicleType(str, enum.Enum):
    truck = "truck"
    van = "van"
    sedan = "sedan"
    bus = "bus"
    motorcycle = "motorcycle"
    other = "other"


>>>>>>> origin/main
class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
<<<<<<< HEAD
    reg_number = Column(String, unique=True, nullable=False)
    model_name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    max_load_capacity = Column(Float, nullable=False)
    odometer = Column(Float, default=0.0, nullable=False)
    acquisition_cost = Column(Float, nullable=False)
    region = Column(String, nullable=False)
    status = Column(
        Enum(VehicleStatusEnum),
        default=VehicleStatusEnum.available,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Explicit indexes for search/filter performance (beyond unique constraint)
    __table_args__ = (
        Index("ix_vehicles_reg_number", "reg_number"),
        Index("ix_vehicles_status", "status"),
        Index("ix_vehicles_region", "region"),
    )
=======
    reg_number = Column(String, unique=True, nullable=False, index=True)
    model = Column(String, nullable=False)
    type = Column(String, nullable=False)  # free-form string for flexibility
    max_load = Column(Float, nullable=False)            # tonnes
    odometer = Column(Float, default=0.0)               # km
    acquisition_cost = Column(Float, nullable=False)    # currency units
    status = Column(
        SAEnum(VehicleStatus, name="vehiclestatus", create_type=False),
        default=VehicleStatus.available,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
>>>>>>> origin/main
