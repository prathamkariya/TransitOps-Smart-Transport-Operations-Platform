from pydantic import BaseModel, Field, AliasChoices
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
    pass

class TripResponse(TripBase):
    id: int
    status: str

    class Config:
        from_attributes = True

