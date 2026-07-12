<<<<<<< HEAD
from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..core.db import Base


class Expense(Base):
    """Defined by Eng 01. Logic written by Eng 02/03."""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    type = Column(String, nullable=False)   # e.g. "tolls", "misc"
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle")
=======
import enum
from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ExpenseType(str, enum.Enum):
    toll = "toll"
    repair = "repair"
    misc = "misc"


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(SAEnum(ExpenseType, name="expensetype", create_type=False), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", backref="expenses")
    trip = relationship("Trip", backref="expenses")
>>>>>>> origin/main
