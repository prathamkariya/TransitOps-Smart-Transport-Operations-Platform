from pydantic import BaseModel, Field, AliasChoices, ConfigDict
from datetime import datetime
from typing import Optional


class TripBase(BaseModel):
    source: str = Field(..., min_length=1)
    destination: str = Field(..., min_length=1)
    vehicle_id: int
    driver_id: int
    cargo_weight: float = Field(..., gt=0)
    distance: float = Field(..., gt=0, validation_alias=AliasChoices('planned_distance', 'distance'))


class TripCreate(TripBase):
    revenue: Optional[float] = 0.0


class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    revenue: Optional[float] = 0.0
    status: str
    created_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
