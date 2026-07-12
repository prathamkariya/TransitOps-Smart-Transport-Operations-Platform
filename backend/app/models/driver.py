import enum
<<<<<<< HEAD

from sqlalchemy import Column, Date, DateTime, Enum, Float, Index, Integer, String
from sqlalchemy.sql import func

from ..core.db import Base


class DriverStatusEnum(str, enum.Enum):
=======
from sqlalchemy import Column, Integer, String, Float, Date, Enum as SAEnum, DateTime
from sqlalchemy.sql import func
from app.database import Base


class DriverStatus(str, enum.Enum):
>>>>>>> origin/main
    available = "available"
    on_trip = "on_trip"
    off_duty = "off_duty"
    suspended = "suspended"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
<<<<<<< HEAD
    license_number = Column(String, unique=True, nullable=False)
    license_category = Column(String, nullable=True)
    license_expiry = Column(Date, nullable=False)
    contact_number = Column(String, nullable=True)
    safety_score = Column(Float, default=100.0, nullable=False)
    status = Column(
        Enum(DriverStatusEnum),
        default=DriverStatusEnum.available,
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
        Index("ix_drivers_license_number", "license_number"),
        Index("ix_drivers_status", "status"),
    )
=======
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
>>>>>>> origin/main
