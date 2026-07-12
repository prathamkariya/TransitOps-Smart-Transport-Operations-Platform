import enum
from sqlalchemy import Column, Integer, String, Float, Date, Enum as SAEnum, DateTime
from sqlalchemy.sql import func
from app.database import Base


class DriverStatus(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    off_duty = "off_duty"
    suspended = "suspended"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False, index=True)
    license_category = Column(String, nullable=False)  # e.g. A, B, C, D, E
    license_expiry = Column(Date, nullable=False)
    contact = Column(String)
    safety_score = Column(Float, default=100.0)
    status = Column(
        SAEnum(DriverStatus, name="driverstatus", create_type=False),
        default=DriverStatus.available,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
