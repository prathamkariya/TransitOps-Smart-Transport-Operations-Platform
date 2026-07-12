import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TripStatus(str, enum.Enum):
    draft = "draft"
    dispatched = "dispatched"
    completed = "completed"
    cancelled = "cancelled"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
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
