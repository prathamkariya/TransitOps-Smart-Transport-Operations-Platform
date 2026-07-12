import enum
from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Enum as SAEnum
from sqlalchemy.orm import relationship

from ..core.db import Base


class ExpenseType(str, enum.Enum):
    toll = "toll"
    repair = "repair"
    misc = "misc"

class Expense(Base):
    """Defined by Eng 01. Logic written by Eng 02/03."""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    type = Column(SAEnum(ExpenseType, name="expensetype", create_type=False), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle")
