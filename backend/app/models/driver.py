import enum
from sqlalchemy import Column, Integer, String, Float, Date, Enum
from ..core.db import Base

class DriverStatusEnum(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    off_duty = "off_duty"
    suspended = "suspended"

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    license_category = Column(String)
    license_expiry = Column(Date, nullable=False)
    contact = Column(String)
    safety_score = Column(Float, default=100.0)
    status = Column(Enum(DriverStatusEnum), default=DriverStatusEnum.available, nullable=False)
