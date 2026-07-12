import enum
from sqlalchemy import Column, Integer, String, Float, Enum
from ..core.db import Base

class VehicleStatusEnum(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    in_shop = "in_shop"
    retired = "retired"

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    reg_number = Column(String, unique=True, index=True, nullable=False)
    model = Column(String, nullable=False)
    type = Column(String, nullable=False)
    max_load = Column(Float, nullable=False)
    odometer = Column(Float, default=0.0)
    acquisition_cost = Column(Float, nullable=False)
    status = Column(Enum(VehicleStatusEnum), default=VehicleStatusEnum.available, nullable=False)
