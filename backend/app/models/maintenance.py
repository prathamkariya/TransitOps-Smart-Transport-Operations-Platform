from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.db import Base


class MaintenanceLog(Base):
    """
    Defined by Eng 01. Business logic (opening/closing, vehicle status → in_shop)
    is written by Eng 02. Do NOT add logic here — only schema.
    """
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_type = Column(String, nullable=False)
    cost = Column(Float, nullable=False)
    opened_at = Column(DateTime(timezone=True), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)  # NULL = currently open / in shop
    notes = Column(Text, nullable=True)

    vehicle = relationship("Vehicle")
