import enum
from sqlalchemy import Column, Integer, String, Float, Enum as SAEnum, DateTime
from sqlalchemy.sql import func
from app.database import Base


class VehicleStatus(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    in_shop = "in_shop"
    retired = "retired"


class VehicleType(str, enum.Enum):
    truck = "truck"
    van = "van"
    sedan = "sedan"
    bus = "bus"
    motorcycle = "motorcycle"
    other = "other"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    reg_number = Column(String, unique=True, nullable=False, index=True)
    model_name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # free-form string for flexibility
    max_load_capacity = Column(Float, nullable=False)            # tonnes
    odometer = Column(Float, default=0.0)               # km
    acquisition_cost = Column(Float, nullable=False)    # currency units
    region = Column(String, nullable=False, default="unknown")
    status = Column(
        SAEnum(VehicleStatus, name="vehiclestatus", create_type=False),
        default=VehicleStatus.available,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
