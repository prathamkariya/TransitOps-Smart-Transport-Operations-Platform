import enum

from sqlalchemy import Column, DateTime, Enum, Float, Index, Integer, String
from sqlalchemy.sql import func

from ..core.db import Base


class VehicleStatusEnum(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    in_shop = "in_shop"
    retired = "retired"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    reg_number = Column(String, unique=True, nullable=False)
    model_name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    max_load_capacity = Column(Float, nullable=False)
    odometer = Column(Float, default=0.0, nullable=False)
    acquisition_cost = Column(Float, nullable=False)
    region = Column(String, nullable=False)
    status = Column(
        Enum(VehicleStatusEnum),
        default=VehicleStatusEnum.available,
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
        Index("ix_vehicles_reg_number", "reg_number"),
        Index("ix_vehicles_status", "status"),
        Index("ix_vehicles_region", "region"),
    )
