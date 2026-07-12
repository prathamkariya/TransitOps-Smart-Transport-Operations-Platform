<<<<<<< HEAD
from sqlalchemy import Column, Date, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from ..core.db import Base


class FuelLog(Base):
    """Defined by Eng 01. Logic written by Eng 02/03."""
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle")
=======
from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True)
    liters = Column(Float, nullable=False)
    cost_per_liter = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)     # auto-computed: liters × cost_per_liter
    odometer_reading = Column(Float, nullable=True)  # km at time of fill — used for efficiency calc
    date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", backref="fuel_logs")
>>>>>>> origin/main
