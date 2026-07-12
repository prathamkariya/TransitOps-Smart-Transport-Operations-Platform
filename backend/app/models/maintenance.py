from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True)
    type = Column(String, nullable=False)        # e.g. "Scheduled", "Repair", "Inspection"
    description = Column(String)
    cost = Column(Float, default=0.0)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)  # None = record still open = vehicle In Shop

    vehicle = relationship("Vehicle", backref="maintenance_logs")
