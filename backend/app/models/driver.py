import enum

from sqlalchemy import Column, Date, DateTime, Enum, Float, Index, Integer, String
from sqlalchemy.sql import func

from ..core.db import Base


class DriverStatus(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    off_duty = "off_duty"
    suspended = "suspended"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    license_category = Column(String, nullable=True)
    license_expiry = Column(Date, nullable=False)
    contact_number = Column(String, nullable=True)
    safety_score = Column(Float, default=100.0, nullable=False)
    status = Column(
        Enum(DriverStatus),
        default=DriverStatus.available,
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
