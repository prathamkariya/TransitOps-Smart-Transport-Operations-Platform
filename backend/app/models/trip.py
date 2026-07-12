import enum
<<<<<<< HEAD

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.db import Base


class TripStatusEnum(str, enum.Enum):
=======
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TripStatus(str, enum.Enum):
>>>>>>> origin/main
    draft = "draft"
    dispatched = "dispatched"
    completed = "completed"
    cancelled = "cancelled"


class Trip(Base):
<<<<<<< HEAD
    """
    Defined by Eng 01 (schema owner). Business logic is written by Eng 02.
    Do NOT modify this file without checking with Eng 02 first.
    """
=======
>>>>>>> origin/main
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
<<<<<<< HEAD
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight = Column(Float, nullable=False)
    planned_distance = Column(Float, nullable=True)
    actual_distance = Column(Float, nullable=True)
    fuel_consumed = Column(Float, nullable=True)
    status = Column(
        Enum(TripStatusEnum),
        default=TripStatusEnum.draft,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")
=======
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False, index=True)
    cargo_weight = Column(Float, nullable=False)   # tonnes
    planned_distance = Column(Float, nullable=False)  # km
    revenue = Column(Float, default=0.0)           # for ROI calculation
    status = Column(
        SAEnum(TripStatus, name="tripstatus", create_type=False),
        default=TripStatus.draft,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    vehicle = relationship("Vehicle", backref="trips")
    driver = relationship("Driver", backref="trips")
>>>>>>> origin/main
